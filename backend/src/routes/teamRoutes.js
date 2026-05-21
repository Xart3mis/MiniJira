import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam
} from '../controllers/teamController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;