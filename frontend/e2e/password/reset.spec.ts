/**
 * Password Reset Flow E2E Test
 *
 * Tests the password reset workflow:
 * - Navigate to forgot password
 * - Enter email
 * - Verify email sent (mock)
 * - Reset password
 * - Login with new password
 */

import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test('initiates password reset', async ({ page }) => {
    await page.goto('/forgot-password')

    // Check for email input
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Mock the API call
    await page.route('**/api/auth/sign-in/email/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password reset email sent',
        }),
      })
    })

    await emailInput.fill('test@example.com')
    await page.locator('button[type="submit"]').click()

    // Should show success message
    const bodyText = page.locator('body').textContent() ?? ''
    expect(bodyText.toLowerCase()).toMatch(/sent|email|check|inbox/i)
  })

  test('resets password with OTP', async ({ page }) => {
    await page.goto('/forgot-password')

    // Mock the email OTP send
    await page.route('**/api/auth/sign-in/email/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('button[type="submit"]').click()

    // Navigate to reset page (normally done via email link)
    await page.goto('/reset-password?email=test@example.com')

    // Mock the reset API call
    await page.route('**/api/auth/sign-in/email/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' },
        }),
      })
    })

    // Fill reset form
    await page.locator('input[name="otp"]').fill('123456')
    await page.locator('input[name="password"]').fill('NewPassword123!')
    await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
    await page.locator('button[type="submit"]').click()

    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 5000 })
  })
})
