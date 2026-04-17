/**
 * User Registration Flow E2E Test
 *
 * Tests the complete user registration workflow:
 * - Navigate to signup
 * - Fill form with valid data
 * - Submit
 * - Verify redirect/email verification (mock OTP)
 */

import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('displays signup form', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows validation errors for invalid data', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-email')
    await page.locator('input[name="password"]').fill('short')
    await page.locator('button[type="submit"]').click()

    // Should show validation errors
    const bodyText = page.locator('body').textContent() ?? ''
    expect(bodyText.toLowerCase()).toMatch(/email|invalid|required/)
  })

  test('submits form with valid data', async ({ page }) => {
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('Password123!')

    // Mock the API call - in real E2E this would hit backend
    await page.route('**/api/auth/sign-up/email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
        }),
      })
    })

    await page.locator('button[type="submit"]').click()

    // Should redirect or show success
    await expect(page).toHaveURL(/\/(verify-email|dashboard)/)
  })
})
