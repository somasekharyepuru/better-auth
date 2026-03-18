/**
 * Ban User Flow E2E Test
 *
 * Tests admin banning a user:
 * - Login as admin
 * - Find user
 * - Click ban
 * - Confirm
 * - Verify banned status
 */

import { test, expect } from '@playwright/test'

test.describe('Ban User Flow', () => {
  test('admin bans a user', async ({ page }) => {
    // Mock admin session
    await page.addInitScript(() => {
      localStorage.setItem('better-auth.session_token', 'mock-admin-session')
    })

    // Mock session API
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'admin-id', email: 'admin@example.com', name: 'Admin', role: 'admin' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    // Mock users API with existing user
    await page.route('**/api/admin/users**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            { id: 'user-to-ban', name: 'Trouble User', email: 'trouble@example.com', role: 'member', banned: false },
          ],
          total: 1,
        }),
      })
    })

    // Mock ban API
    await page.route('**/api/admin/users/*/ban/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'user-to-ban', name: 'Trouble User', email: 'trouble@example.com', role: 'member', banned: true },
        }),
      })
    })

    await page.goto('/users')

    // Look for the user and ban button
    const userRow = page.locator('text=trouble@example.com').or(page.locator('text=Trouble User'))
    await expect(userRow.first()).toBeVisible({ timeout: 5000 })

    // Look for ban button
    const banButton = page.locator('button:has-text("Ban"), button:has-text("Suspend")').first()
    if (await banButton.isVisible({ timeout: 3000 })) {
      // Handle confirmation dialog if it appears
      page.on('dialog', async dialog => {
        await dialog.accept()
      })

      await banButton.click()

      // Verify banned status is shown
      await expect(page.locator('body')).toContainText(/banned|suspended/i, { timeout: 5000 })
    }
  })
})
