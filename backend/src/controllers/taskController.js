import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    deleteItem,
    scanTable,
    queryByIndex,
    updateItem
} from '../services/dynamoService.js';
import { sns } from '../config/aws.js';

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE;
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const TEAMS_TABLE = process.env.DYNAMODB_TEAMS_TABLE;
const PROJECTS_TABLE = process.env.DYNAMODB_PROJECTS_TABLE;
const COMMENTS_TABLE = process.env.DYNAMODB_COMMENTS_TABLE;

async function validateTaskRelations({ teamId, projectId, assigneeId }) {
    const team = await getItem(TEAMS_TABLE, { teamId });

    if (!team) {
        return 'Invalid teamId. Team does not exist.';
    }

    const project = await getItem(PROJECTS_TABLE, { projectId });

    if (!project) {
        return 'Invalid projectId. Project does not exist.';
    }

    const assignee = await getItem(USERS_TABLE, { userId: assigneeId });

    if (!assignee) {
        return 'Invalid assigneeId. User does not exist.';
    }

    if (assignee.role !== 'Employee') {
        return 'Task assignee must be an Employee.';
    }

    if (assignee.teamId !== teamId) {
        return 'Assignee does not belong to the selected team.';
    }

    if (project.teamId !== teamId) {
        return 'Project does not belong to the selected team.';
    }

    return null;
}

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const ALLOWED_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];

async function publishTaskAssignment(task) {
    const topicArn = process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN;
    if (!topicArn) return;

    try {
        await sns.publish({
            TopicArn: topicArn,
            Subject: `Task Assigned: ${task.title}`,
            Message: JSON.stringify({
                eventType: 'TaskAssigned',
                taskId: task.taskId,
                title: task.title,
                assigneeId: task.assigneeId,
                assigneeEmail: task.assigneeEmail,
                assigneeName: task.assigneeName,
                teamId: task.teamId,
                projectId: task.projectId,
                deadline: task.deadline,
                priority: task.priority
            }),
            MessageAttributes: {
                eventType: {
                    DataType: 'String',
                    StringValue: 'TaskAssigned'
                }
            }
        }).promise();
    } catch (err) {
        console.error('SNS publish failed (non-fatal):', err.message);
    }
}

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

        if (!title || !description || !priority || !deadline || !assigneeId || !teamId || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required task fields'
            });
        }

        if (!ALLOWED_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'priority must be one of: Low, Medium, High, Critical'
            });
        }

        const relationError = await validateTaskRelations({
            teamId,
            projectId,
            assigneeId
        });

        if (relationError) {
            return res.status(400).json({
                success: false,
                message: relationError
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
            createdBy: req.user.userId,
            createdAt: now,
            updatedAt: now,
            auditLog: [
                {
                    action: 'Task Created',
                    by: req.user.userId,
                    at: now
                }
            ]
        };

        await putItem(TASKS_TABLE, task);
        await publishTaskAssignment(task);

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

        const role = req.user.role;
        const teamId = req.user.teamId;

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

        const role = req.user.role;
        const teamId = req.user.teamId;

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

        const role = req.user.role;
        const requesterTeamId = req.user.teamId;

        if (role !== 'Manager' && role !== 'Admin' && task.teamId !== requesterTeamId) {
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
            teamId,
            projectId,
            imageUrl
        } = req.body;

        const isEmployee = role === 'Employee';

        const finalTitle = isEmployee ? task.title : (title ?? task.title);
        const finalDescription = isEmployee ? task.description : (description ?? task.description);
        const finalPriority = isEmployee ? task.priority : (priority ?? task.priority);
        const finalDeadline = isEmployee ? task.deadline : (deadline ?? task.deadline);
        const finalAssigneeId = isEmployee ? task.assigneeId : (assigneeId ?? task.assigneeId);
        const finalAssigneeEmail = isEmployee ? task.assigneeEmail : (assigneeEmail ?? task.assigneeEmail);
        const finalAssigneeName = isEmployee ? task.assigneeName : (assigneeName ?? task.assigneeName);
        const finalTeamId = isEmployee ? task.teamId : (teamId ?? task.teamId);
        const finalProjectId = isEmployee ? task.projectId : (projectId ?? task.projectId);
        const finalImageUrl = isEmployee ? task.imageUrl : (imageUrl ?? task.imageUrl);
        const finalStatus = status ?? task.status;

        if (!ALLOWED_PRIORITIES.includes(finalPriority)) {
            return res.status(400).json({
                success: false,
                message: 'priority must be one of: Low, Medium, High, Critical'
            });
        }

        if (!ALLOWED_STATUSES.includes(finalStatus)) {
            return res.status(400).json({
                success: false,
                message: 'status must be one of: To Do, In Progress, Done, Blocked'
            });
        }

        const relationError = await validateTaskRelations({
            teamId: finalTeamId,
            projectId: finalProjectId,
            assigneeId: finalAssigneeId
        });

        if (relationError) {
            return res.status(400).json({
                success: false,
                message: relationError
            });
        }

        const now = new Date().toISOString();
        const auditLog = task.auditLog || [];

        if (finalStatus && finalStatus !== task.status) {
            auditLog.push({
                action: `Status changed from ${task.status} to ${finalStatus}`,
                by: req.user.userId,
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
                projectId = :projectId,
                imageUrl = :imageUrl,
                updatedAt = :updatedAt,
                auditLog = :auditLog`,
            {
                ':title': finalTitle,
                ':description': finalDescription,
                ':status': finalStatus,
                ':priority': finalPriority,
                ':deadline': finalDeadline,
                ':assigneeId': finalAssigneeId,
                ':assigneeEmail': finalAssigneeEmail,
                ':assigneeName': finalAssigneeName,
                ':teamId': finalTeamId,
                ':projectId': finalProjectId,
                ':imageUrl': finalImageUrl,
                ':updatedAt': now,
                ':auditLog': auditLog
            },
            {
                '#status': 'status'
            }
        );

        if (finalAssigneeId !== task.assigneeId) {
            await publishTaskAssignment(updatedTask);
        }

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

        const taskComments = await queryByIndex(
            COMMENTS_TABLE,
            'taskId-index',
            'taskId',
            req.params.id
        );

        for (const comment of taskComments) {
            await deleteItem(COMMENTS_TABLE, {
                commentId: comment.commentId
            });
        }

        await deleteItem(TASKS_TABLE, {
            taskId: req.params.id
        });

        res.json({
            success: true,
            message: 'Task and related comments deleted successfully',
            deleted: {
                taskId: req.params.id,
                commentsCount: taskComments.length,
                comments: taskComments.map((comment) => ({
                    commentId: comment.commentId,
                    text: comment.text,
                    userName: comment.userName,
                    createdAt: comment.createdAt
                }))
            }
        });
    } catch (error) {
        next(error);
    }
}