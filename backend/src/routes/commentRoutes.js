import express from 'express';

import {
    createComment,
    getCommentsByTask,
    updateComment,
    deleteComment
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/', createComment);
router.get('/task/:taskId', getCommentsByTask);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;