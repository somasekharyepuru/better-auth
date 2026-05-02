// Set env before any module imports
process.env.NEXT_PUBLIC_AUTH_URL = 'http://localhost:3002';

describe('sessionManagementApi', () => {
  let sessionManagementApi: typeof import('./session-management-api')['sessionManagementApi'];
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
    // Use isolateModules to get fresh import with env var set
    jest.isolateModules(() => {
      const mod = require('./session-management-api');
      sessionManagementApi = mod.sessionManagementApi;
    });
  });

  describe('revokeAllExceptCurrent', () => {
    it('calls DELETE /sessions/me', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await sessionManagementApi.revokeAllExceptCurrent();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/sessions/me',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Not authenticated' }),
      });

      await expect(sessionManagementApi.revokeAllExceptCurrent()).rejects.toThrow('Not authenticated');
    });
  });

  describe('revokeAllIncludingCurrent', () => {
    it('calls DELETE /sessions/me/all', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await sessionManagementApi.revokeAllIncludingCurrent();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/sessions/me/all',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
    });

    it('falls back to status text when json fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(sessionManagementApi.revokeAllIncludingCurrent()).rejects.toThrow('Internal Server Error');
    });
  });
});
