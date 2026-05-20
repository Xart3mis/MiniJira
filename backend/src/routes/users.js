import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getItem, TABLES } from '../config/dynamodb.js';
import { isManagerRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const isSelf = req.user.userId === userId;

  if (!isSelf && !isManagerRole(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not have access to this user'
    });
  }

  if (isSelf) {
    return res.json({
      success: true,
      data: req.user
    });
  }

  const user = await getItem(TABLES.USERS, { userId });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'User not found'
    });
  }

  return res.json({
    success: true,
    data: user
  });
}));

export default router;
