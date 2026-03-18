/**
 * Login Flow E2E Test
 *
 * Tests the user login workflow:
 * - Navigate to login
 * - Enter credentials
 * - Submit
 * - Verify redirect
 */

import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('displays login form', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Invalid credentials' },
        }),
      })
    })

    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('WrongPassword123!')
    await page.locator('button[type="submit"]').click()

    // Should show error message
    const bodyText = page.locator('body').textContent() ?? ''
    expect(bodyText.toLowerCase()).toMatch(/invalid|credentials|error/)
  })

  test('logs in with valid credentials', async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { id: 'session-id', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        }),
      })
    })

    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('Password123!')
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })
})
