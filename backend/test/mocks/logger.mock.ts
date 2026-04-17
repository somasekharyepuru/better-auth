import { mockDeep, MockProxy } from 'jest-mock-extended';
import { LoggerService } from '@/common/logger.service';

export type LoggerServiceMock = MockProxy<LoggerService>;

let loggerMock: LoggerServiceMock;

export const createLoggerMock = (): LoggerServiceMock => {
  return mockDeep<LoggerService>({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn().mockReturnThis(),
  });
};

export const getLoggerMock = (): LoggerServiceMock => {
  if (!loggerMock) {
    loggerMock = createLoggerMock();
  }
  return loggerMock;
};

export const resetLoggerMock = (): void => {
  loggerMock = createLoggerMock();
};

export const mockLoggerError = () => {
  const mock = getLoggerMock();
  mock.error.mockImplementation((message: string, trace?: string) => {
    console.error(`[MOCK ERROR] ${message}`, trace || '');
  });
  return mock;
};
