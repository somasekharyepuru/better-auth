module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth|@better-auth|@thallesp)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts',
    '!src/**/*.constants.ts',
    '!src/auth/auth.config.ts', // Excluded: Configuration file always mocked in tests
    '!src/seed-admin.ts', // Excluded: Standalone seed script
    '!src/common/logger.service.ts', // Excluded: Winston configuration runs at load time
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^better-auth/(.*)$': '<rootDir>/test/mocks/better-auth.mock.ts',
    '^@thallesp/nestjs-better-auth$': '<rootDir>/test/mocks/nestjs-better-auth.mock.ts',
    '^@/auth/auth.config$': '<rootDir>/test/mocks/auth-config.mock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  preset: 'ts-jest',
  testTimeout: 10000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
