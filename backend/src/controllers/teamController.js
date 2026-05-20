import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    scanTable,
    updateItem,
    deleteItem
} from '../services/dynamoService.js';

const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const PROJECTS_TABLE = process.env.DYNAMODB_PROJECTS_TABLE;
const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;

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
            managerId: managerId || req.user?.userId || 'demo-manager',
            managerName: managerName || req.user?.name || 'Demo Manager',
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
        const role = req.user?.role || req.query.role;
        const teamId = req.user?.teamId || req.query.teamId;

        let teams = await scanTable(TEAMS_TABLE);

        // Temporary filtering until Cognito auth is added
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