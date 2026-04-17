import 'reflect-metadata';
import * as supertest from 'supertest';

declare global {
  namespace NodeJS {
    interface Global {
      testAgent?: supertest.Agent;
    }
  }
}

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/auth_service_test';
process.env.BETTER_AUTH_URL = 'http://localhost:3002';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only-do-not-use-in-production';

// Mock external services
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  // Global setup can go here
});

// Cleanup after all tests
afterAll(async () => {
  // Global cleanup can go here
});

// Setup before each test
beforeEach(async () => {
  // Clear mocks before each test
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(async () => {
  // Cleanup after each test
});
