import express from 'express';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} from '../controllers/projectController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Manager'), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', requireRole('Manager'), updateProject);
router.delete('/:id', requireRole('Manager'), deleteProject);

export default router;