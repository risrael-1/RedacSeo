import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUsers,
  updateUserRole,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  inviteToProject
} from '../controllers/usersController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User management routes (admin/super_admin)
router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);

// Project members routes
router.get('/projects/:projectId/members', getProjectMembers);
router.post('/projects/:projectId/members', addProjectMember);
router.post('/projects/:projectId/invite', inviteToProject);
router.patch('/projects/:projectId/members/:memberId', updateProjectMemberRole);
router.delete('/projects/:projectId/members/:memberId', removeProjectMember);

export default router;
