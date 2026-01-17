import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSeoCriteria,
  initializeDefaultCriteria,
  upsertCriterion,
  deleteCriterion,
  toggleCriterion,
  batchUpdateCriteria,
  resetToDefault
} from '../controllers/seoCriteriaController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all SEO criteria for user
router.get('/', getSeoCriteria);

// Initialize default criteria for user
router.post('/initialize', initializeDefaultCriteria);

// Create or update a single criterion
router.post('/upsert', upsertCriterion);

// Batch update multiple criteria
router.put('/batch', batchUpdateCriteria);

// Reset to default criteria
router.post('/reset', resetToDefault);

// Toggle criterion enabled status
router.patch('/:criterionId/toggle', toggleCriterion);

// Delete a criterion
router.delete('/:criterionId', deleteCriterion);

export default router;
