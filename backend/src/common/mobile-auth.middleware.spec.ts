import { MobileAuthMiddleware } from './mobile-auth.middleware';
import { Request, Response, NextFunction } from 'express';

describe('MobileAuthMiddleware', () => {
  let middleware: MobileAuthMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new MobileAuthMiddleware();
    req = {
      headers: {},
      path: '/api/test',
      ip: '127.0.0.1',
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Set a mobile API key for testing
    process.env.MOBILE_API_KEY = 'test-mobile-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MOBILE_API_KEY;
  });

  describe('bypass paths', () => {
    it('should bypass health endpoint', () => {
      (req as any).path = '/health';

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should bypass ready endpoint', () => {
      (req as any).path = '/ready';

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should bypass queue-stats endpoint', () => {
      (req as any).path = '/queue-stats';

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('mobile authentication with API key', () => {
    it('should authenticate valid mobile request', () => {
      req.headers = {};
      (req.headers as any)['x-mobile-auth'] = 'test-mobile-api-key';

      middleware.use(req as Request, res as Response, next);

      expect(req.headers.origin).toBe('mobile://');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid mobile API key', () => {
      req.headers = {};
      (req.headers as any)['x-mobile-auth'] = 'invalid-api-key';

      middleware.use(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid X-Mobile-Auth header required for mobile clients',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject mobile request without API key', () => {
      req.headers = {};

      middleware.use(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid X-Mobile-Auth header required for mobile clients',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requests with origin header', () => {
    it('should pass through requests with origin header', () => {
      req.headers = { origin: 'https://example.com' };

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should not override existing origin header', () => {
      req.headers = { origin: 'https://example.com' };
      (req.headers as any)['x-mobile-auth'] = 'test-mobile-api-key';

      middleware.use(req as Request, res as Response, next);

      expect(req.headers.origin).toBe('https://example.com');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('without mobile API key configured', () => {
    beforeEach(() => {
      delete process.env.MOBILE_API_KEY;
    });

    it('should pass through when no API key is configured', () => {
      req.headers = {};

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should not set mobile origin when no API key', () => {
      req.headers = {};
      (req.headers as any)['x-mobile-auth'] = 'some-key';

      middleware.use(req as Request, res as Response, next);

      expect(req.headers.origin).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle case-sensitive API key', () => {
      (req.headers as any)['x-mobile-auth'] = 'TEST-MOBILE-API-KEY';

      middleware.use(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty string API key', () => {
      (req.headers as any)['x-mobile-auth'] = '';

      middleware.use(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle undefined x-mobile-auth header', () => {
      req.headers = { origin: undefined };

      middleware.use(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('path variations', () => {
    it('should process API endpoint paths', () => {
      (req as any).path = '/api/auth/login';
      req.headers = { origin: 'https://app.example.com' };

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should process nested paths', () => {
      (req as any).path = '/api/v1/organizations/123/members';
      req.headers = { origin: 'https://app.example.com' };

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
