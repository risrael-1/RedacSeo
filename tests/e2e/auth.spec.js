import { test, expect } from '@playwright/test';

// Generate unique email for each test run
const testEmail = `e2e_test_${Date.now()}@example.com`;
const testPassword = 'E2ETestPassword123!';

test.describe('Authentication E2E Tests', () => {
  test.describe('Registration', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1, h2')).toContainText(/inscription|créer|register/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/register');

      // Fill registration form
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);

      // If there's a confirm password field
      const confirmPassword = page.locator('input[placeholder*="confirm"], input[name*="confirm"]');
      if (await confirmPassword.count() > 0) {
        await confirmPassword.fill(testPassword);
      }

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);

      const confirmPassword = page.locator('input[placeholder*="confirm"], input[name*="confirm"]');
      if (await confirmPassword.count() > 0) {
        await confirmPassword.fill(testPassword);
      }

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.alert-error, .error, [class*="error"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Login', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Should show user info in navbar
      await expect(page.locator('.navbar, nav')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.alert-error, .error, [class*="error"]')).toBeVisible({ timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL('/');
    });

    test('should show error for empty fields', async ({ page }) => {
      await page.goto('/');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation - either HTML5 validation or custom error
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);

      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should logout successfully', async ({ page }) => {
      // Click logout button
      await page.click('button:has-text("Déconnexion"), button:has-text("Logout"), .logout-button');

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
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should navigate between pages', async ({ page }) => {
      // Go to Redaction
      await page.click('a:has-text("Rédaction")');
      await expect(page).toHaveURL(/redaction/);

      // Go to Projects
      await page.click('a:has-text("Projets")');
      await expect(page).toHaveURL(/projects/);

      // Go to Profile
      await page.click('.user-profile-link, a[href="/profile"]');
      await expect(page).toHaveURL(/profile/);

      // Go back to Dashboard
      await page.click('a:has-text("Tableau de bord")');
      await expect(page).toHaveURL(/dashboard/);
    });
  });
});
