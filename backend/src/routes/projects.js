import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteItem, getItem, putItem, query, scan, updateItem, INDEXES, TABLES } from '../config/dynamodb.js';
import { requireRole, isManagerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const PROJECT_FIELDS = ['title', 'description', 'teamId'];

async function getProjectById(projectId) {
  const result = await query(TABLES.PROJECTS, {
    KeyConditionExpression: 'projectId = :projectId',
    ExpressionAttributeValues: {
      ':projectId': projectId
    },
    Limit: 1
  });
  return result.items[0] || null;
}

router.post('/', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { title, description, teamId } = req.body;

  if (!title || !teamId) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'title and teamId are required'
    });
  }

  const now = new Date().toISOString();
  const project = {
    projectId: `proj-${uuidv4()}`,
    title,
    description: description || '',
    teamId,
    createdAt: now,
    updatedAt: now
  };

  await putItem(TABLES.PROJECTS, project);

  return res.status(201).json({
    success: true,
    data: project,
    message: 'Project created'
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { teamId } = req.query;

  if (isManagerRole(req.user.role)) {
    if (teamId) {
      const result = await query(TABLES.PROJECTS, {
        IndexName: INDEXES.PROJECTS_BY_TEAM,
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: {
          ':teamId': teamId
        }
      });
      return res.json({ success: true, data: result.items });
    }

    const result = await scan(TABLES.PROJECTS);
    return res.json({ success: true, data: result.items });
  }

  const result = await query(TABLES.PROJECTS, {
    IndexName: INDEXES.PROJECTS_BY_TEAM,
    KeyConditionExpression: 'teamId = :teamId',
    ExpressionAttributeValues: {
      ':teamId': req.user.teamId
    }
  });
  return res.json({ success: true, data: result.items });
}));

router.get('/:projectId', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await getProjectById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Project not found'
    });
  }

  if (!isManagerRole(req.user.role) && project.teamId !== req.user.teamId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not belong to this team'
    });
  }

  return res.json({ success: true, data: project });
}));

router.put('/:projectId', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await getProjectById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Project not found'
    });
  }

  const updates = {};
  PROJECT_FIELDS.forEach((field) => {
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

  const updated = await updateItem(TABLES.PROJECTS, { projectId, createdAt: project.createdAt }, updates);

  return res.json({
    success: true,
    data: updated,
    message: 'Project updated'
  });
}));

router.delete('/:projectId', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await getProjectById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Project not found'
    });
  }

  await deleteItem(TABLES.PROJECTS, { projectId, createdAt: project.createdAt });

  return res.json({
    success: true,
    message: 'Project deleted'
  });
}));

export default router;
