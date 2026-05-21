import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} from '../controllers/projectController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;