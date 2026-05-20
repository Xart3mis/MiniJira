import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getItem, putItem, updateItem, deleteItem, scan, TABLES } from '../config/dynamodb.js';
import { requireRole, requireTeamAccess, isManagerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'Team name is required'
    });
  }

  const team = {
    teamId: `team-${uuidv4()}`,
    name,
    createdAt: new Date().toISOString()
  };

  await putItem(TABLES.TEAMS, team);

  return res.status(201).json({
    success: true,
    data: team,
    message: 'Team created'
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  if (isManagerRole(req.user.role)) {
    const result = await scan(TABLES.TEAMS);
    return res.json({
      success: true,
      data: result.items
    });
  }

  const team = await getItem(TABLES.TEAMS, { teamId: req.user.teamId });
  return res.json({
    success: true,
    data: team ? [team] : []
  });
}));

router.get('/:teamId', requireTeamAccess('teamId'), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await getItem(TABLES.TEAMS, { teamId });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'Team not found'
    });
  }

  return res.json({
    success: true,
    data: team
  });
}));

router.put('/:teamId', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'Team name is required'
    });
  }

  const updated = await updateItem(TABLES.TEAMS, { teamId }, { name });

  return res.json({
    success: true,
    data: updated,
    message: 'Team updated'
  });
}));

router.delete('/:teamId', requireRole('Manager', 'Admin'), asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  await deleteItem(TABLES.TEAMS, { teamId });

  return res.json({
    success: true,
    message: 'Team deleted'
  });
}));

export default router;
