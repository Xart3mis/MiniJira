import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    deleteItem,
    scanTable,
    queryByIndex,
    updateItem
} from '../services/dynamoService.js';

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;
console.log('TASKS_TABLE from env:', TASKS_TABLE);

export async function createTask(req, res, next) {
    try {
        const {
            title,
            description,
            priority,
            deadline,
            assigneeId,
            assigneeEmail,
            assigneeName,
            teamId,
            projectId,
            imageUrl
        } = req.body;

        if (!title || !description || !priority || !deadline || !assigneeId || !teamId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required task fields'
            });
        }

        const now = new Date().toISOString();

        const task = {
            taskId: uuidv4(),
            title,
            description,
            status: 'To Do',
            priority,
            deadline,
            assigneeId,
            assigneeEmail: assigneeEmail || '',
            assigneeName: assigneeName || '',
            teamId,
            projectId: projectId || '',
            imageUrl: imageUrl || null,
            createdBy: req.user?.userId || 'demo-manager',
            createdAt: now,
            updatedAt: now,
            auditLog: [
                {
                    action: 'Task Created',
                    by: req.user?.userId || 'demo-manager',
                    at: now
                }
            ]
        };

        await putItem(TASKS_TABLE, task);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
}

export async function getTasks(req, res, next) {
    try {
        let tasks;

        const role = req.user?.role || req.query.role;
        const teamId = req.user?.teamId || req.query.teamId;

        if (role === 'Manager' || role === 'Admin') {
            tasks = await scanTable(TASKS_TABLE);
        } else {
            if (!teamId) {
                return res.status(400).json({
                    success: false,
                    message: 'teamId is required for employee task filtering'
                });
            }

            tasks = await queryByIndex(
                TASKS_TABLE,
                'teamId-index',
                'teamId',
                teamId
            );
        }

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
}

export async function getTaskById(req, res, next) {
    try {
        const task = await getItem(TASKS_TABLE, {
            taskId: req.params.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const role = req.user?.role || req.query.role;
        const teamId = req.user?.teamId || req.query.teamId;

        if (role !== 'Manager' && role !== 'Admin' && task.teamId !== teamId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot access this task'
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTask(req, res, next) {
    try {
        const task = await getItem(TASKS_TABLE, {
            taskId: req.params.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const role = req.user?.role || req.query.role;
        const teamId = req.user?.teamId || req.query.teamId;

        if (role !== 'Manager' && role !== 'Admin' && task.teamId !== teamId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot update this task'
            });
        }

        const {
            title,
            description,
            status,
            priority,
            deadline,
            assigneeId,
            assigneeEmail,
            assigneeName,
            teamId: newTeamId,
            imageUrl
        } = req.body;

        const now = new Date().toISOString();
        const auditLog = task.auditLog || [];

        if (status && status !== task.status) {
            auditLog.push({
                action: `Status changed from ${task.status} to ${status}`,
                by: req.user?.userId || 'demo-user',
                at: now
            });
        }

        const updatedTask = await updateItem(
            TASKS_TABLE,
            { taskId: req.params.id },
            `SET 
        title = :title,
        description = :description,
        #status = :status,
        priority = :priority,
        deadline = :deadline,
        assigneeId = :assigneeId,
        assigneeEmail = :assigneeEmail,
        assigneeName = :assigneeName,
        teamId = :teamId,
        imageUrl = :imageUrl,
        updatedAt = :updatedAt,
        auditLog = :auditLog`,
            {
                ':title': title ?? task.title,
                ':description': description ?? task.description,
                ':status': status ?? task.status,
                ':priority': priority ?? task.priority,
                ':deadline': deadline ?? task.deadline,
                ':assigneeId': assigneeId ?? task.assigneeId,
                ':assigneeEmail': assigneeEmail ?? task.assigneeEmail,
                ':assigneeName': assigneeName ?? task.assigneeName,
                ':teamId': newTeamId ?? task.teamId,
                ':imageUrl': imageUrl ?? task.imageUrl,
                ':updatedAt': now,
                ':auditLog': auditLog
            },
            {
                '#status': 'status'
            }
        );

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteTask(req, res, next) {
    try {
        const task = await getItem(TASKS_TABLE, {
            taskId: req.params.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const role = req.user?.role || req.query.role;

        if (role !== 'Manager' && role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Only managers can delete tasks'
            });
        }

        await deleteItem(TASKS_TABLE, {
            taskId: req.params.id
        });

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}