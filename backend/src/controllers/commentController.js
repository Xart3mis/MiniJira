import { v4 as uuidv4 } from 'uuid';
import {
    putItem,
    getItem,
    deleteItem,
    queryByIndex,
    updateItem
} from '../services/dynamoService.js';

const COMMENTS_TABLE = process.env.DYNAMODB_COMMENTS_TABLE;

export async function createComment(req, res, next) {
    try {
        const {
            userId,
            userName,
            text
        } = req.body;

        const taskId = req.params.taskId || req.body.taskId;

        if (!taskId || !text) {
            return res.status(400).json({
                success: false,
                message: 'taskId and text are required'
            });
        }

        const now = new Date().toISOString();

        const comment = {
            commentId: uuidv4(),
            taskId,
            userId: userId || req.user?.userId || 'demo-user',
            userName: userName || req.user?.name || 'Demo User',
            text,
            createdAt: now,
            updatedAt: now
        };

        await putItem(COMMENTS_TABLE, comment);

        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: comment
        });
    } catch (error) {
        next(error);
    }
}

export async function getCommentsByTask(req, res, next) {
    try {
        const comments = await queryByIndex(
            COMMENTS_TABLE,
            'taskId-index',
            'taskId',
            req.params.taskId
        );

        res.json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        next(error);
    }
}

export async function updateComment(req, res, next) {
    try {
        const comment = await getItem(COMMENTS_TABLE, {
            commentId: req.params.id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'text is required'
            });
        }

        const updatedComment = await updateItem(
            COMMENTS_TABLE,
            { commentId: req.params.id },
            `SET 
        #text = :text,
        updatedAt = :updatedAt`,
            {
                ':text': text,
                ':updatedAt': new Date().toISOString()
            },
            {
                '#text': 'text'
            }
        );

        res.json({
            success: true,
            message: 'Comment updated successfully',
            data: updatedComment
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteComment(req, res, next) {
    try {
        const comment = await getItem(COMMENTS_TABLE, {
            commentId: req.params.id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        await deleteItem(COMMENTS_TABLE, {
            commentId: req.params.id
        });

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}