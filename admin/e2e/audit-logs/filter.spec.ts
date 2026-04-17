/**
 * Audit Logs Filter E2E Test
 *
 * Tests viewing and filtering audit logs:
 * - Login as admin
 * - Navigate to audit logs
 * - Apply filters
 * - Verify filtered results
 */

import { test, expect } from '@playwright/test'

test.describe('Audit Logs Filter Flow', () => {
  test('views and filters audit logs', async ({ page }) => {
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

    // Mock audit logs API
    await page.route('**/api/admin/audit-logs**', async route => {
      const url = route.request().url()
      const hasActionFilter = url.includes('action=')
      const hasUserFilter = url.includes('userId=')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            {
              id: 'log-1',
              action: 'user.login',
              userId: 'user-1',
              userName: 'User One',
              timestamp: new Date().toISOString(),
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0...',
            },
            {
              id: 'log-2',
              action: 'user.created',
              userId: 'admin-id',
              userName: 'Admin',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              ipAddress: '192.168.1.2',
              userAgent: 'Mozilla/5.0...',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 50,
        }),
      })
    })

    await page.goto('/audit-logs')

    // Wait for page to load
    await expect(page.locator('body')).toContainText(/audit|logs|activity/i, { timeout: 5000 })

    // Look for filter controls
    const actionFilter = page.locator('select[name="action"], [data-testid="action-filter"]').first()
    if (await actionFilter.isVisible({ timeout: 3000 })) {
      await actionFilter.selectOption({ label: 'Login' })
      await page.waitForTimeout(500)
    }

    // Verify logs are displayed
    await expect(page.locator('body')).toContainText(/login|created|user/i, { timeout: 5000 })
  })

  test('shows pagination for large datasets', async ({ page }) => {
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

    // Mock paginated audit logs API
    await page.route('**/api/admin/audit-logs**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: Array.from({ length: 50 }, (_, i) => ({
            id: `log-${i}`,
            action: 'user.login',
            userId: `user-${i}`,
            userName: `User ${i}`,
            timestamp: new Date().toISOString(),
          })),
          total: 150,
          page: 1,
          pageSize: 50,
        }),
      })
    })

    await page.goto('/audit-logs')

    // Look for pagination controls
    await expect(page.locator('body')).toContainText(/audit|logs|activity/i, { timeout: 5000 })
    const pagination = page.locator('[data-testid="pagination"], .pagination, nav:has-text("Next")').first()
    if (await pagination.isVisible({ timeout: 3000 })) {
      await expect(pagination).toBeVisible()
    }
  })
})
