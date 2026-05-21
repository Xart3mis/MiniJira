import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
} from '../controllers/taskController.js';

import {
    createComment,
    getCommentsByTask
} from '../controllers/commentController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', createTask);
router.get('/', getTasks);
router.post('/:taskId/comments', createComment);
router.get('/:taskId/comments', getCommentsByTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;