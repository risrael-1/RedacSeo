import { test, expect } from '@playwright/test';

// Unique user for the complete journey
const journeyEmail = `journey_${Date.now()}@example.com`;
const journeyPassword = 'JourneyTest123!';
const newPassword = 'NewJourneyPassword456!';

test.describe('Complete User Journey', () => {
  test.describe.serial('From Registration to Account Deletion', () => {
    test('1. Register new account', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', journeyPassword);
      await page.fill('input#confirmPassword', journeyPassword);

      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard (success message appears briefly then redirects after 1.5s)
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Verify we're logged in by checking navbar has logout button
      await expect(page.locator('text=Déconnexion')).toBeVisible({ timeout: 5000 });
    });

    test('2. Navigate to Redaction page', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Navigate to Redaction
      await page.click('text=Rédaction');
      await expect(page).toHaveURL(/redaction/);

      // Verify redaction page elements are visible
      await expect(page.locator('text=Rédaction SEO').first()).toBeVisible();
      await expect(page.locator('text=Nom de l\'article')).toBeVisible();
    });

    test('3. Access Profile page', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Navigate to Profile via the user profile link
      await page.click('.user-profile-link');
      await expect(page).toHaveURL(/profile/);

      // Verify profile page content
      await expect(page.locator('text=Mon Profil')).toBeVisible();
    });

    test('4. Change password', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Profile
      await page.click('.user-profile-link');
      await expect(page).toHaveURL(/profile/);

      // Fill password change form
      await page.fill('input#currentPassword', journeyPassword);
      await page.fill('input#newPassword', newPassword);
      await page.fill('input#confirmPassword', newPassword);

      // Submit password change
      await page.click('button:has-text("Modifier le mot de passe")');

      // Wait for success message (uses .alert.alert-success class)
      await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10000 });
    });

    test('5. Login with new password', async ({ page }) => {
      await page.goto('/');

      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', newPassword);
      await page.click('button[type="submit"]');

      // Should successfully login
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('6. Delete account', async ({ page }) => {
      // Login with new password
      await page.goto('/');
      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', newPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Profile
      await page.click('.user-profile-link');
      await expect(page).toHaveURL(/profile/);

      // Click delete account button
      await page.click('button:has-text("Supprimer mon compte")');

      // Fill password for confirmation (input inside danger-zone form)
      await page.locator('.danger-zone input[type="password"]').fill(newPassword);

      // Confirm deletion
      await page.click('button:has-text("Confirmer la suppression")');

      // Should be redirected to login page
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('7. Verify account is deleted', async ({ page }) => {
      await page.goto('/');

      await page.fill('input#email', journeyEmail);
      await page.fill('input#password', newPassword);
      await page.click('button[type="submit"]');

      // Wait for the button to finish loading (indicates request completed)
      await expect(page.locator('button[type="submit"]')).toContainText('Se connecter', { timeout: 15000 });

      // Should stay on login page (account was deleted so login fails)
      await expect(page).toHaveURL('/');

      // Verify we're still on login page by checking for the form
      await expect(page.locator('input#email')).toBeVisible();
    });
  });
});
