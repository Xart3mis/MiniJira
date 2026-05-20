import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    scanTable,
    updateItem,
    deleteItem
} from '../services/dynamoService.js';

const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;

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