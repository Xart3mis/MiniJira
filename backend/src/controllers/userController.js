import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    scanTable,
    updateItem,
    deleteItem
} from '../services/dynamoService.js';

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;
const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;

export async function createUser(req, res, next) {
    try {
        const {
            userId: bodyUserId,
            name,
            email,
            role,
            teamId
        } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'name, email, and role are required'
            });
        }

        const allowedRoles = ['Manager', 'Employee'];
        const normalizedRole = role ? (role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()) : role;

        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: 'role must be either Manager or Employee'
            });
        }

        if (normalizedRole === 'Employee' && !teamId) {
            return res.status(400).json({
                success: false,
                message: 'teamId is required for Employee users'
            });
        }

        if (teamId) {
            const team = await getItem(TEAMS_TABLE, {
                teamId
            });

            if (!team) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teamId. Team does not exist.'
                });
            }
        }

        const users = await scanTable(USERS_TABLE);
        const emailExists = users.some(
            (user) => user.email.toLowerCase() === email.toLowerCase()
        );

        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        const now = new Date().toISOString();

        const user = {
            userId: bodyUserId || uuidv4(),
            name,
            email,
            role: normalizedRole,
            teamId: teamId || '',
            createdAt: now,
            updatedAt: now
        };

        await putItem(USERS_TABLE, user);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export async function getUsers(req, res, next) {
    try {
        const users = await scanTable(USERS_TABLE);

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
}

export async function getMe(req, res, next) {
    try {
        const userId = req.user.userId;

        let user = await getItem(USERS_TABLE, { userId });

        if (!user) {
            // First login: bootstrap a DynamoDB profile from Cognito JWT claims
            const now = new Date().toISOString();
            user = {
                userId,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role,
                teamId: req.user.teamId || '',
                createdAt: now,
                updatedAt: now
            };
            await putItem(USERS_TABLE, user);
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export async function getUserById(req, res, next) {
    try {
        const user = await getItem(USERS_TABLE, {
            userId: req.params.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const requesterRole = req.user.role;
        const requesterId = req.user.userId;

        if (requesterRole !== 'Manager' && requesterId !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own user profile'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const user = await getItem(USERS_TABLE, {
            userId: req.params.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const {
            name,
            email,
            role,
            teamId
        } = req.body;

        const rawRole = role ?? user.role;
        const finalRole = rawRole ? (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()) : rawRole;
        const finalTeamId = teamId ?? user.teamId;

        const allowedRoles = ['Manager', 'Employee'];

        if (!allowedRoles.includes(finalRole)) {
            return res.status(400).json({
                success: false,
                message: 'role must be either Manager or Employee'
            });
        }

        if (finalRole === 'Employee' && !finalTeamId) {
            return res.status(400).json({
                success: false,
                message: 'teamId is required for Employee users'
            });
        }

        if (finalTeamId) {
            const team = await getItem(TEAMS_TABLE, {
                teamId: finalTeamId
            });

            if (!team) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teamId. Team does not exist.'
                });
            }
        }

        const updatedUser = await updateItem(
            USERS_TABLE,
            { userId: req.params.id },
            `SET 
        #name = :name,
        email = :email,
        #role = :role,
        teamId = :teamId,
        updatedAt = :updatedAt`,
            {
                ':name': name ?? user.name,
                ':email': email ?? user.email,
                ':role': finalRole,
                ':teamId': finalTeamId,
                ':updatedAt': new Date().toISOString()
            },
            {
                '#name': 'name',
                '#role': 'role'
            }
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const user = await getItem(USERS_TABLE, {
            userId: req.params.id
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const tasks = await scanTable(TASKS_TABLE);

        const assignedTasks = tasks
            .filter((task) => task.assigneeId === req.params.id)
            .map((task) => ({
                taskId: task.taskId,
                title: task.title,
                status: task.status,
                priority: task.priority,
                projectId: task.projectId,
                teamId: task.teamId
            }));

        if (assignedTasks.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete user because tasks are still assigned to this user.',
                usedBy: {
                    tasks: assignedTasks
                }
            });
        }

        await deleteItem(USERS_TABLE, {
            userId: req.params.id
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}