import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getMyOrganization,
  getAllOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
  getOrganizationMembers,
  addOrganizationMember,
  inviteToOrganization,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  getOrganizationInvitations,
  cancelOrganizationInvitation,
  acceptOrganizationInvitation,
  getMyPendingInvitations,
  acceptInvitationById,
  declineInvitationById
} from '../controllers/organizationsController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ===== Static routes first (before :id routes) =====

// My organization (for org account owners)
router.get('/mine', getMyOrganization);

// My pending invitations (for invited users)
router.get('/my/invitations', getMyPendingInvitations);
router.post('/my/invitations/:invitationId/accept', acceptInvitationById);
router.delete('/my/invitations/:invitationId', declineInvitationById);

// Accept invitation by token (from email link)
router.post('/invitations/:token/accept', acceptOrganizationInvitation);

// Super admin: get all organizations
router.get('/', getAllOrganizations);

// Create organization (upgrade to org account)
router.post('/', createOrganization);

// ===== Dynamic :id routes =====

// Organization CRUD
router.get('/:id', getOrganization);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

// Organization Logo
router.post('/:id/logo', uploadOrganizationLogo);
router.delete('/:id/logo', deleteOrganizationLogo);

// Organization Members
router.get('/:id/members', getOrganizationMembers);
router.post('/:id/members', addOrganizationMember);
router.post('/:id/invite', inviteToOrganization);
router.patch('/:id/members/:memberId', updateOrganizationMemberRole);
router.delete('/:id/members/:memberId', removeOrganizationMember);

// Organization Invitations (admin view)
router.get('/:id/invitations', getOrganizationInvitations);
router.delete('/:id/invitations/:invitationId', cancelOrganizationInvitation);

export default router;
