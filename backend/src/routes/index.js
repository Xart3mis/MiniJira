import express from 'express';
import userRoutes from './users.js';
import teamRoutes from './teams.js';
import projectRoutes from './projects.js';
import taskRoutes from './tasks.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

export default router;
