import { test, expect } from '@playwright/test';

// Unique user for the complete journey
const journeyEmail = `journey_${Date.now()}@example.com`;
const journeyPassword = 'JourneyTest123!';
const newPassword = 'NewJourneyPassword456!';

test.describe('Complete User Journey', () => {
  test.describe.serial('From Registration to Account Deletion', () => {
    test('1. Register new account', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', journeyPassword);

      // Handle confirm password if present
      const confirmPassword = page.locator('input[placeholder*="confirm"], input[name*="confirm"]');
      if (await confirmPassword.count() > 0) {
        await confirmPassword.fill(journeyPassword);
      }

      await page.click('button[type="submit"]');

      // Verify redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

      // Verify user is shown in navbar
      await expect(page.locator('.user-email, .navbar')).toContainText(journeyEmail.split('@')[0], { ignoreCase: true });
    });

    test('2. Navigate to Redaction page', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Navigate to Redaction
      await page.click('a:has-text("Rédaction")');
      await expect(page).toHaveURL(/redaction/);

      // Verify editor is visible
      await expect(page.locator('[contenteditable="true"], .editor, textarea')).toBeVisible();
    });

    test('3. Create and save an article', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Redaction
      await page.click('a:has-text("Rédaction")');
      await expect(page).toHaveURL(/redaction/);

      // Fill article title
      const titleInput = page.locator('input[placeholder*="titre"], input[name*="title"], .article-title input');
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Article Title');
      }

      // Fill editor content
      const editor = page.locator('[contenteditable="true"]').first();
      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('This is test article content for E2E testing.');
      }

      // Save article (if save button exists)
      const saveButton = page.locator('button:has-text("Sauvegarder"), button:has-text("Enregistrer"), button:has-text("Save")');
      if (await saveButton.count() > 0) {
        await saveButton.click();

        // Wait for save confirmation
        await expect(page.locator('.alert-success, [class*="success"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('4. Access Profile page', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Navigate to Profile
      await page.click('.user-profile-link, a[href="/profile"]');
      await expect(page).toHaveURL(/profile/);

      // Verify profile page content
      await expect(page.locator('h1, h2, h3')).toContainText(/profil/i);
      await expect(page.locator('text=' + journeyEmail)).toBeVisible();
    });

    test('5. Change password', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', journeyPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Profile
      await page.click('.user-profile-link, a[href="/profile"]');
      await expect(page).toHaveURL(/profile/);

      // Find password change form
      await page.fill('input#currentPassword, input[name="currentPassword"]', journeyPassword);
      await page.fill('input#newPassword, input[name="newPassword"]', newPassword);
      await page.fill('input#confirmPassword, input[name="confirmPassword"]', newPassword);

      // Submit password change
      await page.click('button:has-text("Modifier le mot de passe")');

      // Wait for success message
      await expect(page.locator('.alert-success, [class*="success"]')).toBeVisible({ timeout: 5000 });
    });

    test('6. Login with new password', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', newPassword);
      await page.click('button[type="submit"]');

      // Should successfully login
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('7. Delete account', async ({ page }) => {
      // Login with new password
      await page.goto('/');
      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', newPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Go to Profile
      await page.click('.user-profile-link, a[href="/profile"]');
      await expect(page).toHaveURL(/profile/);

      // Click delete account button
      await page.click('button:has-text("Supprimer mon compte")');

      // Fill password for confirmation
      const deletePasswordInput = page.locator('.delete-form input[type="password"], .danger-zone input[type="password"]');
      await deletePasswordInput.fill(newPassword);

      // Confirm deletion
      await page.click('button:has-text("Confirmer la suppression")');

      // Should be redirected to login page
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('8. Verify account is deleted', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[type="email"]', journeyEmail);
      await page.fill('input[type="password"]', newPassword);
      await page.click('button[type="submit"]');

      // Should show error - account doesn't exist
      await expect(page.locator('.alert-error, .error, [class*="error"]')).toBeVisible({ timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL('/');
    });
  });
});
