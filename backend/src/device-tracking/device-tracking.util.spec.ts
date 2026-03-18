// Mock PrismaClient before importing the utility
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    knownDevice: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock email queue service
jest.mock('../email-queue/email-queue.service', () => ({
  emailQueueService: {
    addEmailJob: jest.fn(),
  },
}));

// Mock logger
jest.mock('../common/logger.service', () => ({
  createChildLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock user agent parser
jest.mock('../common/user-agent-parser', () => ({
  parseUserAgent: jest.fn((ua: string) => ({
    browser: 'Chrome',
    os: 'Windows 10',
  })),
}));

import { trackDeviceLogin } from './device-tracking.util';

describe('device-tracking.util', () => {
  let prismaInstance: any;
  let emailQueueService: any;

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient();
    emailQueueService = require('../email-queue/email-queue.service').emailQueueService;

    // Reset all mocks
    prismaInstance.knownDevice.findUnique.mockReset();
    prismaInstance.knownDevice.update.mockReset();
    prismaInstance.knownDevice.create.mockReset();
    emailQueueService.addEmailJob.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackDeviceLogin', () => {
    const mockUserId = 'user-1';
    const mockUserEmail = 'user@example.com';
    const mockIp = '192.168.1.1';
    const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0';

    it('should return false for known device and update lastSeen', async () => {
      const existingDevice = {
        id: 'device-1',
        userId: mockUserId,
        fingerprint: 'abc123',
        name: 'Chrome on Windows 10',
        lastSeen: new Date('2024-01-01'),
      };
      prismaInstance.knownDevice.findUnique.mockResolvedValue(existingDevice);
      prismaInstance.knownDevice.update.mockResolvedValue({ ...existingDevice, lastSeen: new Date() });

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(false);
      expect(prismaInstance.knownDevice.findUnique).toHaveBeenCalledWith({
        where: {
          userId_fingerprint: { userId: mockUserId, fingerprint: expect.any(String) },
        },
      });
      expect(prismaInstance.knownDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-1' },
        data: { lastSeen: expect.any(Date) },
      });
      expect(emailQueueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('should return true for new device and send notification email', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({
        id: 'device-1',
        userId: mockUserId,
        fingerprint: 'abc123',
        name: 'Chrome on Windows 10',
      });
      emailQueueService.addEmailJob.mockResolvedValue(undefined);

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(true);
      expect(prismaInstance.knownDevice.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          fingerprint: expect.any(String),
          name: 'Chrome on Windows 10',
        },
      });
      expect(emailQueueService.addEmailJob).toHaveBeenCalledWith(
        mockUserEmail,
        expect.stringContaining('"device":"Chrome on Windows 10"'),
        'new-device-login'
      );
    });

    it('should handle race condition when device already exists (P2002)', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      const error = { code: 'P2002' };
      prismaInstance.knownDevice.create.mockRejectedValue(error);

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(false);
      expect(emailQueueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('should handle email notification failure gracefully', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({
        id: 'device-1',
        userId: mockUserId,
        fingerprint: 'abc123',
        name: 'Chrome on Windows 10',
      });
      emailQueueService.addEmailJob.mockRejectedValue(new Error('Email service down'));

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(true); // Should still return true despite email failure
      expect(prismaInstance.knownDevice.create).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      prismaInstance.knownDevice.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(false);
      expect(prismaInstance.knownDevice.create).not.toHaveBeenCalled();
      expect(emailQueueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('should generate consistent fingerprint for same IP and User-Agent', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({ id: 'device-1' });

      await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);
      const firstCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      prismaInstance.knownDevice.create.mockClear();
      await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);
      const secondCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      expect(firstCall).toBe(secondCall);
    });

    it('should generate different fingerprints for different IPs', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({ id: 'device-1' });

      await trackDeviceLogin(mockUserId, mockUserEmail, '192.168.1.1', mockUserAgent);
      const firstCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      prismaInstance.knownDevice.create.mockClear();
      await trackDeviceLogin(mockUserId, mockUserEmail, '192.168.1.2', mockUserAgent);
      const secondCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      expect(firstCall).not.toBe(secondCall);
    });

    it('should generate different fingerprints for different User-Agents', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({ id: 'device-1' });

      await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, 'Mozilla/5.0 Chrome');
      const firstCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      prismaInstance.knownDevice.create.mockClear();
      await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, 'Mozilla/5.0 Firefox');
      const secondCall = prismaInstance.knownDevice.create.mock.calls[0][0].data.fingerprint;

      expect(firstCall).not.toBe(secondCall);
    });

    it('should include device name and IP in email data', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockResolvedValue({ id: 'device-1' });
      emailQueueService.addEmailJob.mockResolvedValue(undefined);

      await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      const emailData = JSON.parse(emailQueueService.addEmailJob.mock.calls[0][1]);
      expect(emailData.device).toBe('Chrome on Windows 10');
      expect(emailData.ip).toBe(mockIp);
      expect(emailData.time).toBeDefined();
    });

    it('should handle non-P2002 database errors during create', async () => {
      prismaInstance.knownDevice.findUnique.mockResolvedValue(null);
      prismaInstance.knownDevice.create.mockRejectedValue(new Error('Constraint violation'));

      const result = await trackDeviceLogin(mockUserId, mockUserEmail, mockIp, mockUserAgent);

      expect(result).toBe(false);
      expect(emailQueueService.addEmailJob).not.toHaveBeenCalled();
    });
  });
});
