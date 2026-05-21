import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createUser,
    getUsers,
    getMe,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/userController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', createUser);
router.get('/', getUsers);
router.get('/me', getMe);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;