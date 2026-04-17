/**
 * Admin Login Flow E2E Test
 *
 * Tests admin panel login:
 * - Navigate to admin
 * - Enter admin credentials
 * - Verify access to admin panel
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays login form', async ({ page }) => {
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('logs in with admin credentials', async ({ page }) => {
    // Mock session API for authenticated user
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'admin-user-id', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    // Mock sign-in API
    await page.route('**/api/auth/sign-in/email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'admin-user-id', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    await page.locator('input[name="email"]').fill('admin@example.com')
    await page.locator('input[name="password"]').fill('AdminPassword123!')
    await page.locator('button[type="submit"]').click()

    // Should show admin dashboard
    const bodyText = page.locator('body').textContent() ?? ''
    expect(bodyText.toLowerCase()).toMatch(/users|organizations|audit|dashboard/i)
  })

  test('denies access for non-admin users', async ({ page }) => {
    // Mock session API for non-admin user
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'user-id', email: 'user@example.com', name: 'Regular User', role: 'member' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    await page.goto('/users')

    // Should show access denied or redirect
    const bodyText = page.locator('body').textContent() ?? ''
    expect(bodyText.toLowerCase()).toMatch(/unauthorized|denied|forbidden|access/i)
  })
})
