/**
 * MSW (Mock Service Worker) Server for Tests
 */

import { setupServer } from 'msw/node'
import { HttpResponse } from 'msw'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// Start server before all tests
export async function startMsw() {
  server.listen({
    onUnhandledRequest: 'bypass',
  })
}

// Close server after all tests
export async function closeMsw() {
  server.close()
}

// Reset handlers after each test
export function resetMswHandlers() {
  server.resetHandlers()
}

// Add custom handler for a specific test
export function addMswHandler(...newHandlers: typeof handlers) {
  server.use(...newHandlers)
}

// Utility to create an error response
export function createErrorResponse(
  message: string,
  status: number = 400
) {
  return HttpResponse.json({ error: message }, { status })
}

// Export handlers for direct use if needed
export { handlers }
