import express from 'express';

import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember
} from '../controllers/teamController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Manager'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', requireRole('Manager'), updateTeam);
router.delete('/:id', requireRole('Manager'), deleteTeam);

router.post('/:id/members', requireRole('Manager'), addMember);
router.delete('/:id/members/:userId', requireRole('Manager'), removeMember);

export default router;