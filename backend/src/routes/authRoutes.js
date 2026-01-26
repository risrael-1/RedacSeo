import express from 'express';
import {
  register,
  login,
  resetPassword,
  getCurrentUser,
  changePassword,
  changeEmail,
  updateProfile,
  deleteAccount
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);
router.post('/change-email', authenticateToken, changeEmail);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/delete-account', authenticateToken, deleteAccount);

export default router;
