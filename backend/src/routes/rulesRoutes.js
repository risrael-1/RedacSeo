import express from 'express';
import { getRules, upsertRule, batchUpdateRules } from '../controllers/rulesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

router.get('/', getRules);
router.post('/', upsertRule);
router.post('/batch', batchUpdateRules);

export default router;
