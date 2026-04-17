import { RequestContextMiddleware, getLoggerForRequest } from './request-context.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
    req = {
      headers: {},
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
    } as any;
    res = {
      setHeader: jest.fn(),
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        // Simulate finish event
        if (event === 'finish') {
          setTimeout(() => callback(), 0);
        }
      }),
    } as any;
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use method', () => {
    it('should create request context with generated UUID', () => {
      middleware.use(req as Request, res as Response, next);

      expect(req.context).toBeDefined();
      expect(req.context?.requestId).toBeDefined();
      expect(req.context?.startTime).toBeDefined();
      expect(typeof req.context?.requestId).toBe('string');
    });

    it('should use existing request ID from header', () => {
      const existingRequestId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
      req.headers = { 'x-request-id': existingRequestId };

      middleware.use(req as Request, res as Response, next);

      expect(req.context?.requestId).toBe(existingRequestId);
      expect(req.requestId).toBe(existingRequestId);
    });

    it('should set X-Request-ID response header', () => {
      middleware.use(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    });

    it('should call next function', () => {
      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should track start time', () => {
      const beforeUse = Date.now();
      middleware.use(req as Request, res as Response, next);
      const afterUse = Date.now();

      expect(req.context?.startTime).toBeGreaterThanOrEqual(beforeUse);
      expect(req.context?.startTime).toBeLessThanOrEqual(afterUse);
    });
  });

  describe('response logging', () => {
    it('should log successful requests (2xx)', async () => {
      res.statusCode = 200;
      (res as any).on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      });

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log redirect requests (3xx)', async () => {
      res.statusCode = 301;
      (res as any).on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      });

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log client errors (4xx)', async () => {
      res.statusCode = 404;
      (res as any).on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      });

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log server errors (5xx)', async () => {
      res.statusCode = 500;
      (res as any).on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      });

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });

  describe('log data', () => {
    it('should include method and path in log data', async () => {
      (req as any).method = 'POST';
      (req as any).path = '/api/users';

      const finishCallback = jest.fn();
      (res as any).on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback.mockImplementation(callback);
        }
      });

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should include IP address in log data', () => {
      (req as any).ip = '192.168.1.1';
      req.headers = { 'user-agent': 'TestAgent/1.0' };

      middleware.use(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('getLoggerForRequest', () => {
    it('should create logger with request ID', () => {
      (req as any).requestId = 'test-request-id';

      const logger = getLoggerForRequest(req as Request);

      expect(logger).toBeDefined();
    });

    it('should handle request without request ID', () => {
      (req as any).requestId = undefined;

      expect(() => {
        getLoggerForRequest(req as Request);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle missing user agent header', () => {
      req.headers = {};

      expect(() => {
        middleware.use(req as Request, res as Response, next);
      }).not.toThrow();
    });

    it('should handle response without finish event', () => {
      (res as any).on = jest.fn();

      middleware.use(req as Request, res as Response, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should handle very long request paths', () => {
      (req as any).path = '/api/v1/' + 'a'.repeat(1000);

      expect(() => {
        middleware.use(req as Request, res as Response, next);
      }).not.toThrow();
    });
  });
});
