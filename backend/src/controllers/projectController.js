import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    deleteItem,
    scanTable,
    queryByIndex,
    updateItem
} from '../services/dynamoService.js';

const PROJECTS_TABLE = process.env.DYNAMODB_PROJECTS_TABLE;
const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;
const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;

export async function createProject(req, res, next) {
    try {
        const {
            name,
            description,
            teamId,
            managerId,
            managerName,
            status,
            startDate,
            deadline
        } = req.body;

        if (!name || !description || !teamId) {
            return res.status(400).json({
                success: false,
                message: 'name, description, and teamId are required'
            });
        }

        const team = await getItem(TEAMS_TABLE, { teamId });

        if (!team) {
            return res.status(400).json({
                success: false,
                message: 'Invalid teamId. Team does not exist.'
            });
        }
        const now = new Date().toISOString();

        const project = {
            projectId: uuidv4(),
            name,
            description,
            teamId,
            managerId: managerId || req.user?.userId || 'demo-manager',
            managerName: managerName || 'Demo Manager',
            status: status || 'Active',
            startDate: startDate || now.split('T')[0],
            deadline: deadline || '',
            createdAt: now,
            updatedAt: now
        };

        await putItem(PROJECTS_TABLE, project);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export async function getProjects(req, res, next) {
    try {
        const role = req.user?.role;
        const userTeamId = req.user?.teamId;

        let projects;
        if (role === 'Manager') {
            projects = await scanTable(PROJECTS_TABLE);
        } else {
            if (!userTeamId) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'No team assigned to this user'
                });
            }
            projects = await queryByIndex(PROJECTS_TABLE, 'teamId-index', 'teamId', userTeamId);
        }

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
}

export async function getProjectById(req, res, next) {
    try {
        const project = await getItem(PROJECTS_TABLE, {
            projectId: req.params.id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const role = req.user?.role;
        const userTeamId = req.user?.teamId;

        if (role !== 'Manager' && project.teamId !== userTeamId) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You do not have access to this project'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProject(req, res, next) {
    try {
        const project = await getItem(PROJECTS_TABLE, {
            projectId: req.params.id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const {
            name,
            description,
            teamId,
            managerId,
            managerName,
            status,
            startDate,
            deadline
        } = req.body;

        const now = new Date().toISOString();

        const updatedProject = await updateItem(
            PROJECTS_TABLE,
            { projectId: req.params.id },
            `SET 
        #name = :name,
        description = :description,
        teamId = :teamId,
        managerId = :managerId,
        managerName = :managerName,
        #status = :status,
        startDate = :startDate,
        deadline = :deadline,
        updatedAt = :updatedAt`,
            {
                ':name': name ?? project.name,
                ':description': description ?? project.description,
                ':teamId': teamId ?? project.teamId,
                ':managerId': managerId ?? project.managerId,
                ':managerName': managerName ?? project.managerName,
                ':status': status ?? project.status,
                ':startDate': startDate ?? project.startDate,
                ':deadline': deadline ?? project.deadline,
                ':updatedAt': now
            },
            {
                '#name': 'name',
                '#status': 'status'
            }
        );

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: updatedProject
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteProject(req, res, next) {
    try {
        const project = await getItem(PROJECTS_TABLE, {
            projectId: req.params.id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const tasks = await scanTable(TASKS_TABLE);

        const projectTasks = tasks
            .filter((task) => task.projectId === req.params.id)
            .map((task) => ({
                taskId: task.taskId,
                title: task.title,
                status: task.status,
                priority: task.priority,
                assigneeName: task.assigneeName
            }));

        if (projectTasks.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete project because tasks are still assigned to it.',
                usedBy: {
                    tasks: projectTasks
                }
            });
        }

        await deleteItem(PROJECTS_TABLE, {
            projectId: req.params.id
        });

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}