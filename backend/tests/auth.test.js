import request from 'supertest';
import app from '../src/app.js';
import { supabase } from '../src/config/supabase.js';
import { cleanupTestUser } from './setup.js';

// Generate unique test user for each test run
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';
let authToken = null;

describe('Auth API Tests', () => {
  // Clean up before and after all tests
  beforeAll(async () => {
    await cleanupTestUser(supabase, testEmail);
  });

  afterAll(async () => {
    await cleanupTestUser(supabase, testEmail);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.message).toBe('User registered successfully');

      authToken = res.body.token;
    });

    it('should reject registration with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });

    it('should reject registration without email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: testPassword
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email and password are required');
    });

    it('should reject registration without password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.message).toBe('Login successful');

      authToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login without credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email and password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/auth/change-password', () => {
    const newPassword = 'NewPassword456!';

    it('should change password successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: newPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Mot de passe modifié avec succès');
    });

    it('should be able to login with new password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: newPassword
        });

      expect(res.statusCode).toBe(200);
      authToken = res.body.token;
    });

    it('should reject change with wrong current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPassword789!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Mot de passe actuel incorrect');
    });

    it('should reject password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: newPassword,
          newPassword: '12345'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Le nouveau mot de passe doit contenir au moins 6 caractères');
    });
  });

  describe('POST /api/auth/change-email', () => {
    const newEmail = `test_changed_${Date.now()}@example.com`;
    let currentPassword = 'NewPassword456!';

    it('should change email successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: newEmail,
          password: currentPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Email modifié avec succès');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(newEmail.toLowerCase());

      // Update token for subsequent tests
      authToken = res.body.token;
    });

    it('should reject change with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'another@example.com',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Mot de passe incorrect');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'invalid-email',
          password: currentPassword
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Format d\'email invalide');
    });

    // Clean up the changed email user
    afterAll(async () => {
      await cleanupTestUser(supabase, newEmail);
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    // Create a separate user for deletion test
    const deleteTestEmail = `test_delete_${Date.now()}@example.com`;
    const deleteTestPassword = 'DeleteTest123!';
    let deleteToken = null;

    beforeAll(async () => {
      // Register a user specifically for deletion test
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: deleteTestEmail,
          password: deleteTestPassword
        });

      deleteToken = res.body.token;
    });

    it('should delete account successfully', async () => {
      const res = await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({
          password: deleteTestPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Compte supprimé avec succès');
    });

    it('should not be able to login after deletion', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: deleteTestEmail,
          password: deleteTestPassword
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject deletion with wrong password', async () => {
      // Need to create another user for this test
      const anotherEmail = `test_another_${Date.now()}@example.com`;
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: anotherEmail,
          password: 'TestPassword123!'
        });

      const res = await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${registerRes.body.token}`)
        .send({
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Mot de passe incorrect');

      // Cleanup
      await cleanupTestUser(supabase, anotherEmail);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('RedacSeo API is running');
  });
});
