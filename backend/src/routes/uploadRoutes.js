import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';
import { getPresignedUploadUrl } from '../controllers/uploadController.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/presigned', getPresignedUploadUrl);

export default router;
