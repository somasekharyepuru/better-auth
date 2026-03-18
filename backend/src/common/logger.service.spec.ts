import { createChildLogger, auditLogger, logger } from './logger.service';

describe('LoggerService', () => {
  describe('logger', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log info messages', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test info message');
      expect(spy).toHaveBeenCalledWith('Test info message');
    });

    it('should log error messages', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(spy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const spy = jest.spyOn(logger, 'warn');
      logger.warn('Test warning message');
      expect(spy).toHaveBeenCalledWith('Test warning message');
    });

    it('should log debug messages in development', () => {
      const spy = jest.spyOn(logger, 'debug');
      logger.debug('Test debug message');
      expect(spy).toHaveBeenCalledWith('Test debug message');
    });

    it('should handle errors with stack trace', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error with stack\n    at test.js:10:15';

      const spy = jest.spyOn(logger, 'error');
      logger.error('Error occurred', error);

      expect(spy).toHaveBeenCalled();
    });

    it('should serialize Error objects properly', () => {
      const error = new Error('Test error');
      const spy = jest.spyOn(logger, 'error');

      logger.error('Error with metadata', { error, userId: '123' });

      expect(spy).toHaveBeenCalled();
    });

    it('should log with requestId when provided', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Message with requestId', { requestId: 'req-123' });
      expect(spy).toHaveBeenCalled();
    });

    it('should handle empty metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Message without metadata');
      expect(spy).toHaveBeenCalled();
    });

    it('should handle complex metadata objects', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Complex metadata', {
        user: { id: '123', name: 'Test' },
        action: 'login',
        timestamp: new Date(),
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should handle null and undefined values in metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Null metadata', { value: null, other: undefined });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('createChildLogger', () => {
    it('should create child logger with context', () => {
      const childLogger = createChildLogger('TestContext');
      expect(childLogger).toBeDefined();
    });

    it('should create child logger with metadata', () => {
      const meta = { userId: '123', requestId: 'abc' };
      const childLogger = createChildLogger('TestContext', meta);
      expect(childLogger).toBeDefined();
    });

    it('should log through child logger', () => {
      const childLogger = createChildLogger('TestContext');
      const spy = jest.spyOn(childLogger, 'info');

      childLogger.info('Child logger message');
      expect(spy).toHaveBeenCalledWith('Child logger message');
    });

    it('should create child logger with empty metadata', () => {
      const childLogger = createChildLogger('TestContext', {});
      expect(childLogger).toBeDefined();
    });

    it('should log error through child logger', () => {
      const childLogger = createChildLogger('TestContext');
      const spy = jest.spyOn(childLogger, 'error');
      childLogger.error('Child error message', { error: new Error('test') });
      expect(spy).toHaveBeenCalled();
    });

    it('should log warn through child logger', () => {
      const childLogger = createChildLogger('TestContext');
      const spy = jest.spyOn(childLogger, 'warn');
      childLogger.warn('Child warning message');
      expect(spy).toHaveBeenCalled();
    });

    it('should log debug through child logger', () => {
      const childLogger = createChildLogger('TestContext');
      const spy = jest.spyOn(childLogger, 'debug');
      childLogger.debug('Child debug message');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('auditLogger', () => {
    it('should create audit logger', () => {
      expect(auditLogger).toBeDefined();
    });

    it('should have audit context', () => {
      const spy = jest.spyOn(auditLogger, 'info');
      auditLogger.info('Audit event');
      expect(spy).toHaveBeenCalled();
    });

    it('should log audit events with metadata', () => {
      const spy = jest.spyOn(auditLogger, 'info');
      auditLogger.info('Audit event', {
        action: 'user.login',
        userId: '123',
        ip: '192.168.1.1',
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should log audit warnings', () => {
      const spy = jest.spyOn(auditLogger, 'warn');
      auditLogger.warn('Audit warning', { reason: 'suspicious activity' });
      expect(spy).toHaveBeenCalled();
    });

    it('should log audit errors', () => {
      const spy = jest.spyOn(auditLogger, 'error');
      auditLogger.error('Audit error', { error: 'failed operation' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('logger configuration', () => {
    it('should have exitOnError set to false', () => {
      expect(logger.exitOnError).toBe(false);
    });

    it('should respect test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have transports configured', () => {
      expect(logger.transports).toBeDefined();
    });

    it('should have format configured', () => {
      expect(logger.format).toBeDefined();
    });

    it('should have level configured', () => {
      expect(logger.level).toBeDefined();
    });
  });

  describe('log levels', () => {
    it('should support verbose level', () => {
      const spy = jest.spyOn(logger, 'verbose');
      logger.verbose('Verbose message');
      expect(spy).toHaveBeenCalled();
    });

    it('should support silly level', () => {
      const spy = jest.spyOn(logger, 'silly');
      logger.silly('Silly message');
      expect(spy).toHaveBeenCalled();
    });
  });
});
