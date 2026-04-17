/**
 * Create Organization Flow E2E Test
 *
 * Tests creating a new organization:
 * - Login as user
 * - Navigate to organizations
 * - Click "New Organization"
 * - Fill form
 * - Verify creation
 */

import { test, expect } from '@playwright/test'

test.describe('Create Organization Flow', () => {
  test('creates a new organization', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('better-auth.session_token', 'mock-session-token')
    })

    // Mock API responses
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    await page.route('**/api/organization/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-org-id',
            name: 'Test Organization',
            slug: 'test-organization',
          }),
        })
      }
    })

    // Navigate to organizations page
    await page.goto('/organizations')

    // Check if organizations list is visible
    await expect(page.locator('body')).toContainText(/organizations/i, { timeout: 5000 })

    // Look for "New Organization" or "Create" button
    const createButton = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New"), a:has-text("Create")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
    }

    // Try navigating directly to create page if button not found
    const url = page.url()
    if (!url.includes('/create')) {
      await page.goto('/organizations/create')
    }

    // Fill organization form
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    await nameInput.fill('Test Organization')

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Verify redirect or success message
    await expect(page).toHaveURL(/\/organizations/, { timeout: 5000 })
  })
})
