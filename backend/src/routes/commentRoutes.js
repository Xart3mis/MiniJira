import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createComment,
    getCommentsByTask,
    updateComment,
    deleteComment
} from '../controllers/commentController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', createComment);
router.get('/task/:taskId', getCommentsByTask);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;