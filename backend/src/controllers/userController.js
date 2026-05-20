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

export async function createUser(req, res, next) {
    try {
        const {
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

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'role must be either Manager or Employee'
            });
        }

        if (role === 'Employee' && !teamId) {
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
            userId: uuidv4(),
            name,
            email,
            role,
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
        // Temporary until Cognito is connected
        const userId = req.user?.userId || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required until authentication is added'
            });
        }

        const user = await getItem(USERS_TABLE, {
            userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
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

        // Temporary role check until Cognito is added
        const requesterRole = req.user?.role || req.query.role;
        const requesterId = req.user?.userId || req.query.requesterId;

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

        const finalRole = role ?? user.role;
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