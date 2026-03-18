/**
 * MSW (Mock Service Worker) Setup for Jest
 * This file runs before each test file to set up API mocking
 */

import { server } from './test/mocks/server'

// Start MSW server before all tests
beforeAll(async () => {
  await server.listen({
    onUnhandledRequest: 'bypass',
  })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Close MSW server after all tests
afterAll(async () => {
  await server.close()
})
