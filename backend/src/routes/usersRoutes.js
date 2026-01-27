import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUsers,
  updateUserRole,
  deleteUserAsAdmin,
  getAdminStats,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  inviteToProject,
  getOrgMembersForAssignment,
  assignOrgMemberToProject
} from '../controllers/usersController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User management routes (admin/super_admin)
router.get('/', getUsers);
router.get('/admin/stats', getAdminStats);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUserAsAdmin);

// Project members routes
router.get('/projects/:projectId/members', getProjectMembers);
router.post('/projects/:projectId/members', addProjectMember);
router.post('/projects/:projectId/invite', inviteToProject);
router.patch('/projects/:projectId/members/:memberId', updateProjectMemberRole);
router.delete('/projects/:projectId/members/:memberId', removeProjectMember);

// Organization members assignment to projects
router.get('/projects/:projectId/org-members', getOrgMembersForAssignment);
router.post('/projects/:projectId/assign', assignOrgMemberToProject);

export default router;
