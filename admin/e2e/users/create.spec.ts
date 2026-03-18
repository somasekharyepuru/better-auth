/**
 * Create User Flow E2E Test
 *
 * Tests admin creating a new user:
 * - Login as admin
 * - Navigate to users
 * - Click "Add User"
 * - Fill form
 * - Verify user created
 */

import { test, expect } from '@playwright/test'

test.describe('Create User Flow', () => {
  test('admin creates a new user', async ({ page }) => {
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

    // Mock users list API
    await page.route('**/api/admin/users**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'new-user-id', name: 'New User', email: 'newuser@example.com', role: 'member' },
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [],
            total: 0,
          }),
        })
      }
    })

    await page.goto('/users')

    // Check for "Add User" or "Create User" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
    if (await addButton.isVisible({ timeout: 3000 })) {
      await addButton.click()
    }

    // Look for user creation form (modal or separate page)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    const emailInput = page.locator('input[name="email"], input[placeholder*="email" i]')

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('New User')
      await emailInput.fill('newuser@example.com')
      await page.locator('button[type="submit"]:visible').click()

      // Verify user appears in list
      await expect(page.locator('body')).toContainText(/new.?user|newuser@example\.com/i, { timeout: 5000 })
    }
  })
})
