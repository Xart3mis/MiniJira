import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    scanTable,
    updateItem,
    deleteItem
} from '../services/dynamoService.js';
import { cognitoISP } from '../config/aws.js';

const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const PROJECTS_TABLE = process.env.DYNAMODB_PROJECTS_TABLE;
const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

async function syncCognitoTeamId(userEmail, teamId) {
    if (!COGNITO_USER_POOL_ID || !userEmail) return;
    try {
        await cognitoISP.adminUpdateUserAttributes({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username: userEmail,
            UserAttributes: [
                { Name: 'custom:teamid', Value: teamId || '' }
            ]
        }).promise();
    } catch (err) {
        console.error('Cognito teamId sync failed (non-fatal):', err.message);
    }
}

export async function createTeam(req, res, next) {
    try {
        const {
            name,
            description,
            managerId,
            managerName,
            members
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Team name is required'
            });
        }

        const now = new Date().toISOString();

        const team = {
            teamId: uuidv4(),
            name,
            description: description || '',
            managerId: managerId || req.user.userId,
            managerName: managerName || req.user.name,
            members: members || [],
            createdAt: now,
            updatedAt: now
        };

        await putItem(TEAMS_TABLE, team);

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: team
        });
    } catch (error) {
        next(error);
    }
}

export async function getTeams(req, res, next) {
    try {
        const role = req.user.role;
        const teamId = req.user.teamId;

        let teams = await scanTable(TEAMS_TABLE);

        if (role === 'Employee' && teamId) {
            teams = teams.filter((team) => team.teamId === teamId);
        }

        res.json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        next(error);
    }
}

export async function getTeamById(req, res, next) {
    try {
        const team = await getItem(TEAMS_TABLE, {
            teamId: req.params.id
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTeam(req, res, next) {
    try {
        const team = await getItem(TEAMS_TABLE, {
            teamId: req.params.id
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const {
            name,
            description,
            managerId,
            managerName,
            members
        } = req.body;

        const updatedTeam = await updateItem(
            TEAMS_TABLE,
            { teamId: req.params.id },
            `SET 
        #name = :name,
        description = :description,
        managerId = :managerId,
        managerName = :managerName,
        members = :members,
        updatedAt = :updatedAt`,
            {
                ':name': name ?? team.name,
                ':description': description ?? team.description,
                ':managerId': managerId ?? team.managerId,
                ':managerName': managerName ?? team.managerName,
                ':members': members ?? team.members,
                ':updatedAt': new Date().toISOString()
            },
            {
                '#name': 'name'
            }
        );

        res.json({
            success: true,
            message: 'Team updated successfully',
            data: updatedTeam
        });
    } catch (error) {
        next(error);
    }
}

export async function addMember(req, res, next) {
    try {
        const team = await getItem(TEAMS_TABLE, { teamId: req.params.id });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const user = await getItem(USERS_TABLE, { userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role?.toLowerCase() !== 'employee') {
            return res.status(400).json({
                success: false,
                message: 'Only Employee users can be added as team members'
            });
        }

        const members = team.members || [];

        if (members.includes(userId)) {
            return res.status(409).json({
                success: false,
                message: 'User is already a member of this team'
            });
        }

        if (user.teamId && user.teamId !== req.params.id) {
            return res.status(409).json({
                success: false,
                message: `User already belongs to another team (${user.teamId}). Remove them first.`
            });
        }

        const updatedMembers = [...members, userId];

        await updateItem(
            TEAMS_TABLE,
            { teamId: req.params.id },
            'SET members = :members, updatedAt = :updatedAt',
            {
                ':members': updatedMembers,
                ':updatedAt': new Date().toISOString()
            }
        );

        await updateItem(
            USERS_TABLE,
            { userId },
            'SET teamId = :teamId, updatedAt = :updatedAt',
            {
                ':teamId': req.params.id,
                ':updatedAt': new Date().toISOString()
            }
        );

        await syncCognitoTeamId(user.email, req.params.id);

        res.json({
            success: true,
            message: 'Member added successfully',
            data: { teamId: req.params.id, userId, members: updatedMembers }
        });
    } catch (error) {
        next(error);
    }
}

export async function removeMember(req, res, next) {
    try {
        const team = await getItem(TEAMS_TABLE, { teamId: req.params.id });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const { userId } = req.params;
        const members = team.members || [];

        if (!members.includes(userId)) {
            return res.status(404).json({
                success: false,
                message: 'User is not a member of this team'
            });
        }

        const memberUser = await getItem(USERS_TABLE, { userId });

        const updatedMembers = members.filter((id) => id !== userId);

        await updateItem(
            TEAMS_TABLE,
            { teamId: req.params.id },
            'SET members = :members, updatedAt = :updatedAt',
            {
                ':members': updatedMembers,
                ':updatedAt': new Date().toISOString()
            }
        );

        await updateItem(
            USERS_TABLE,
            { userId },
            'SET teamId = :teamId, updatedAt = :updatedAt',
            {
                ':teamId': '',
                ':updatedAt': new Date().toISOString()
            }
        );

        await syncCognitoTeamId(memberUser?.email, '');

        res.json({
            success: true,
            message: 'Member removed successfully',
            data: { teamId: req.params.id, userId, members: updatedMembers }
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteTeam(req, res, next) {
    try {
        const team = await getItem(TEAMS_TABLE, {
            teamId: req.params.id
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const users = await scanTable(USERS_TABLE);
        const projects = await scanTable(PROJECTS_TABLE);
        const tasks = await scanTable(TASKS_TABLE);

        const teamUsers = users
            .filter((user) => user.teamId === req.params.id)
            .map((user) => ({
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }));

        const teamProjects = projects
            .filter((project) => project.teamId === req.params.id)
            .map((project) => ({
                projectId: project.projectId,
                name: project.name,
                status: project.status
            }));

        const teamTasks = tasks
            .filter((task) => task.teamId === req.params.id)
            .map((task) => ({
                taskId: task.taskId,
                title: task.title,
                status: task.status,
                assigneeName: task.assigneeName
            }));

        if (teamUsers.length > 0 || teamProjects.length > 0 || teamTasks.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete team because it is still used by users, projects, or tasks.',
                usedBy: {
                    users: teamUsers,
                    projects: teamProjects,
                    tasks: teamTasks
                }
            });
        }

        await deleteItem(TEAMS_TABLE, {
            teamId: req.params.id
        });

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}