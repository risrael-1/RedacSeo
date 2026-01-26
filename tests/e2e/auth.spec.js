import { test, expect } from '@playwright/test';

// Each test suite uses its own unique user to avoid parallel execution conflicts
const baseEmail = `e2e_test_${Date.now()}`;
const testPassword = 'E2ETestPassword123!';

test.describe('Authentication E2E Tests', () => {
  test.describe('Registration', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1')).toContainText('Créer un compte');
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('input#confirmPassword')).toBeVisible();
    });

    test('should register a new user successfully', async ({ page }) => {
      const uniqueEmail = `${baseEmail}_reg@example.com`;
      await page.goto('/register');

      // Fill registration form
      await page.fill('input#email', uniqueEmail);
      await page.fill('input#password', testPassword);
      await page.fill('input#confirmPassword', testPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard (success message shows briefly then redirects)
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Verify we're logged in by checking navbar
      await expect(page.locator('text=Déconnexion')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for existing email', async ({ page }) => {
      const uniqueEmail = `${baseEmail}_existing@example.com`;

      // First, register the user
      await page.goto('/register');
      await page.fill('input#email', uniqueEmail);
      await page.fill('input#password', testPassword);
      await page.fill('input#confirmPassword', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Logout
      await page.click('text=Déconnexion');
      await expect(page).toHaveURL('/');

      // Try to register again with same email
      await page.goto('/register');
      await page.fill('input#email', uniqueEmail);
      await page.fill('input#password', testPassword);
      await page.fill('input#confirmPassword', testPassword);
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    });

    test('should show field error for missing confirm password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input#email', 'test@example.com');
      await page.fill('input#password', testPassword);
      // Don't fill confirmPassword

      await page.click('button[type="submit"]');

      // Should show field error
      await expect(page.locator('.field-error')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input#email', 'mismatch@example.com');
      await page.fill('input#password', testPassword);
      await page.fill('input#confirmPassword', 'DifferentPassword123!');

      await page.click('button[type="submit"]');

      // Should show mismatch error
      await expect(page.locator('.field-error')).toContainText('correspondent');
    });
  });

  test.describe('Login', () => {
    const loginEmail = `${baseEmail}_login@example.com`;

    test.beforeAll(async ({ request }) => {
      // Create user via API for login tests
      await request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: loginEmail,
          password: testPassword
        }
      });
    });

    test('should display login page', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('h1')).toContainText('RedacSEO');
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('input#email', loginEmail);
      await page.fill('input#password', testPassword);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Should show navbar with logout button
      await expect(page.locator('text=Déconnexion')).toBeVisible();
    });

    test('should stay on login page for invalid credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('input#email', 'wrong@example.com');
      await page.fill('input#password', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Wait for the button to stop showing loading state (indicates request completed)
      await expect(page.locator('button[type="submit"]')).toContainText('Se connecter', { timeout: 15000 });

      // Should stay on login page (not redirect to dashboard)
      await expect(page).toHaveURL('/');

      // Verify we're still on login page by checking for the form
      await expect(page.locator('input#email')).toBeVisible();
    });

    test('should show field error for empty email', async ({ page }) => {
      await page.goto('/');

      // Only fill password, leave email empty
      await page.fill('input#password', testPassword);
      await page.click('button[type="submit"]');

      // Should show field error for email
      await expect(page.locator('.field-error')).toContainText('email');
    });

    test('should show field error for short password', async ({ page }) => {
      await page.goto('/');

      await page.fill('input#email', loginEmail);
      await page.fill('input#password', '123'); // Too short
      await page.click('button[type="submit"]');

      // Should show field error for password
      await expect(page.locator('.field-error')).toContainText('6 caractères');
    });
  });

  test.describe('Logout', () => {
    const logoutEmail = `${baseEmail}_logout@example.com`;

    test.beforeAll(async ({ request }) => {
      // Create user via API
      await request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: logoutEmail,
          password: testPassword
        }
      });
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/');
      await page.fill('input#email', logoutEmail);
      await page.fill('input#password', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Click logout button
      await page.click('text=Déconnexion');

      // Should redirect to login page
      await expect(page).toHaveURL('/');

      // Should not be able to access protected routes
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/');
    });

    test('should redirect to login when accessing profile', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL('/');
    });

    test('should redirect to login when accessing redaction', async ({ page }) => {
      await page.goto('/redaction');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Navigation Links', () => {
    const navEmail = `${baseEmail}_nav@example.com`;

    test.beforeAll(async ({ request }) => {
      // Create user via API
      await request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: navEmail,
          password: testPassword
        }
      });
    });

    test('should navigate between pages', async ({ page }) => {
      // Login first
      await page.goto('/');
      await page.fill('input#email', navEmail);
      await page.fill('input#password', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Redaction
      await page.click('text=Rédaction');
      await expect(page).toHaveURL(/redaction/);

      // Go to Projects
      await page.click('text=Projets');
      await expect(page).toHaveURL(/projects/);

      // Go back to Dashboard
      await page.click('text=Tableau de bord');
      await expect(page).toHaveURL(/dashboard/);
    });
  });
});
