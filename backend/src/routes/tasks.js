import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteItem,
  putItem,
  query,
  scan,
  updateItem,
  INDEXES,
  TABLES
} from '../config/dynamodb.js';
import { requireRole, isManagerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const TASK_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'deadline',
  'assigneeId',
  'teamId',
  'projectId',
  'imageUrl',
  'imageVersions'
];

async function getTaskById(taskId) {
  const result = await query(TABLES.TASKS, {
    KeyConditionExpression: 'taskId = :taskId',
    ExpressionAttributeValues: {
      ':taskId': taskId
    },
    Limit: 1
  });
  return result.items[0] || null;
}

async function recordStatusChange(task, user, newStatus) {
  if (task.status === newStatus) {
    return;
  }

  const now = new Date().toISOString();
  const logEntry = {
    taskId: task.taskId,
    timestamp: now,
    userId: user.userId,
    action: 'status_change',
    oldStatus: task.status,
    newStatus
  };

  await putItem(TABLES.ACTIVITY_LOG, logEntry);
}

router.post('/', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { title, description, priority, deadline, assigneeId, teamId, projectId, imageUrl } = req.body;

  if (!title || !teamId || !assigneeId) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'title, teamId, and assigneeId are required'
    });
  }

  const now = new Date().toISOString();
  const task = {
    taskId: `task-${uuidv4()}`,
    title,
    description: description || '',
    status: 'ToDo',
    priority: priority || 'Medium',
    deadline: deadline || null,
    assigneeId,
    teamId,
    projectId: projectId || null,
    imageUrl: imageUrl || null,
    imageVersions: [],
    createdAt: now,
    updatedAt: now
  };

  await putItem(TABLES.TASKS, task);

  return res.status(201).json({
    success: true,
    data: task,
    message: 'Task created'
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, teamId, assigneeId } = req.query;
  let tasks = [];

  if (isManagerRole(req.user.role)) {
    if (assigneeId) {
      const result = await query(TABLES.TASKS, {
        IndexName: INDEXES.TASKS_BY_ASSIGNEE,
        KeyConditionExpression: 'assigneeId = :assigneeId',
        ExpressionAttributeValues: {
          ':assigneeId': assigneeId
        }
      });
      tasks = result.items;
    } else if (teamId) {
      const result = await query(TABLES.TASKS, {
        IndexName: INDEXES.TASKS_BY_TEAM,
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: {
          ':teamId': teamId
        }
      });
      tasks = result.items;
    } else {
      const result = await scan(TABLES.TASKS);
      tasks = result.items;
    }
  } else {
    const result = await query(TABLES.TASKS, {
      IndexName: INDEXES.TASKS_BY_TEAM,
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': req.user.teamId
      }
    });
    tasks = result.items;
  }

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  return res.json({
    success: true,
    data: tasks
  });
}));

router.get('/:taskId', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await getTaskById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Task not found'
    });
  }

  if (!isManagerRole(req.user.role) && task.teamId !== req.user.teamId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not belong to this team'
    });
  }

  return res.json({
    success: true,
    data: task
  });
}));

router.put('/:taskId', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await getTaskById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Task not found'
    });
  }

  if (!isManagerRole(req.user.role)) {
    if (task.teamId !== req.user.teamId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not belong to this team'
      });
    }

    if (task.assigneeId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update tasks assigned to you'
      });
    }

    if (Object.keys(req.body).some((field) => field !== 'status')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Employees can only update task status'
      });
    }
  }

  const updates = {};
  TASK_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'No updates provided'
    });
  }

  await recordStatusChange(task, req.user, updates.status || task.status);
  const updated = await updateItem(TABLES.TASKS, { taskId, createdAt: task.createdAt }, updates);

  return res.json({
    success: true,
    data: updated,
    message: 'Task updated'
  });
}));

router.delete('/:taskId', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await getTaskById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Task not found'
    });
  }

  await deleteItem(TABLES.TASKS, { taskId, createdAt: task.createdAt });

  return res.json({
    success: true,
    message: 'Task deleted'
  });
}));

router.post('/:taskId/comments', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'Comment text is required'
    });
  }

  const task = await getTaskById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Task not found'
    });
  }

  if (!isManagerRole(req.user.role) && task.teamId !== req.user.teamId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not belong to this team'
    });
  }

  const comment = {
    taskId,
    commentId: `comment-${uuidv4()}`,
    authorId: req.user.userId,
    text,
    createdAt: new Date().toISOString()
  };

  await putItem(TABLES.COMMENTS, comment);

  return res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment added'
  });
}));

router.get('/:taskId/comments', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await getTaskById(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Task not found'
    });
  }

  if (!isManagerRole(req.user.role) && task.teamId !== req.user.teamId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not belong to this team'
    });
  }

  const result = await query(TABLES.COMMENTS, {
    KeyConditionExpression: 'taskId = :taskId',
    ExpressionAttributeValues: {
      ':taskId': taskId
    }
  });

  return res.json({
    success: true,
    data: result.items
  });
}));

export default router;
