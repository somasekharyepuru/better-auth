import { DeviceTrackingService } from './device-tracking.service';
import { PrismaService } from '../common/prisma.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock the user-agent-parser
jest.mock('../common/user-agent-parser', () => ({
  parseUserAgent: jest.fn((ua: string) => ({
    browser: ua.includes('Chrome') ? 'Chrome' : 'Unknown',
    os: ua.includes('Windows') ? 'Windows' : 'Unknown',
    device: 'Desktop',
  })),
}));

describe('DeviceTrackingService', () => {
  let service: DeviceTrackingService;
  let prisma: PrismaClient;
  let emailQueue: EmailQueueService;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    emailQueue = mockDeep<EmailQueueService>();
    service = new DeviceTrackingService(prisma as any, emailQueue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFingerprint', () => {
    it('should generate consistent fingerprint for same inputs', () => {
      const fp1 = service.generateFingerprint('192.168.1.1', 'Mozilla/5.0');
      const fp2 = service.generateFingerprint('192.168.1.1', 'Mozilla/5.0');

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different inputs', () => {
      const fp1 = service.generateFingerprint('192.168.1.1', 'Mozilla/5.0');
      const fp2 = service.generateFingerprint('192.168.1.2', 'Mozilla/5.0');

      expect(fp1).not.toBe(fp2);
    });

    it('should generate 64-character hex string', () => {
      const fp = service.generateFingerprint('192.168.1.1', 'Mozilla/5.0');

      expect(fp).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(fp)).toBe(true);
    });
  });

  describe('getDeviceName', () => {
    it('should generate device name from user agent', () => {
      const name = service.getDeviceName('Mozilla/5.0 Chrome Windows');

      expect(name).toBe('Chrome on Windows');
    });

    it('should handle unknown user agent', () => {
      const name = service.getDeviceName('unknown');

      expect(name).toBe('Unknown on Unknown');
    });
  });

  describe('trackLogin', () => {
    const mockUserId = 'user-123';
    const mockUserEmail = 'test@example.com';
    const mockIP = '192.168.1.1';
    const mockUserAgent = 'Mozilla/5.0 Chrome Windows';

    it('should track known device and update last seen', async () => {
      const existingDevice = {
        id: 'device-1',
        userId: mockUserId,
        fingerprint: 'a'.repeat(64),
        name: 'Chrome on Windows',
        lastSeen: new Date('2024-01-01'),
      };

      (prisma.knownDevice.findUnique as any).mockResolvedValue(existingDevice);
      (prisma.knownDevice.update as any).mockResolvedValue({ ...existingDevice, lastSeen: new Date() });

      const result = await service.trackLogin(mockUserId, mockUserEmail, mockIP, mockUserAgent);

      expect(result).toBe(false);
      expect(prisma.knownDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-1' },
        data: { lastSeen: expect.any(Date) },
      });
      expect(emailQueue.addEmailJob).not.toHaveBeenCalled();
    });

    it('should detect new device and send notification', async () => {
      (prisma.knownDevice.findUnique as any).mockResolvedValue(null);
      (prisma.knownDevice.create as any).mockResolvedValue({
        id: 'new-device-1',
        userId: mockUserId,
        fingerprint: 'a'.repeat(64),
        name: 'Chrome on Windows',
        lastSeen: new Date(),
      });

      const result = await service.trackLogin(mockUserId, mockUserEmail, mockIP, mockUserAgent);

      expect(result).toBe(true);
      expect(prisma.knownDevice.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          fingerprint: expect.any(String),
          name: 'Chrome on Windows',
        },
      });
      expect(emailQueue.addEmailJob).toHaveBeenCalledWith(
        mockUserEmail,
        expect.stringContaining('"device":"Chrome on Windows"'),
        'new-device-login'
      );
    });

    it('should handle race condition when device is created between check and create', async () => {
      const error = new Error('Unique constraint violation');
      (error as any).code = 'P2002';

      (prisma.knownDevice.findUnique as any).mockResolvedValue(null);
      (prisma.knownDevice.create as any).mockRejectedValue(error);

      const result = await service.trackLogin(mockUserId, mockUserEmail, mockIP, mockUserAgent);

      expect(result).toBe(false);
    });

    it('should throw error for non-unique constraint failures', async () => {
      const error = new Error('Database error');
      (prisma.knownDevice.findUnique as any).mockResolvedValue(null);
      (prisma.knownDevice.create as any).mockRejectedValue(error);

      await expect(service.trackLogin(mockUserId, mockUserEmail, mockIP, mockUserAgent)).rejects.toThrow();
    });

    it('should handle email queue failure gracefully', async () => {
      (emailQueue.addEmailJob as any).mockRejectedValue(new Error('Email queue error'));
      (prisma.knownDevice.findUnique as any).mockResolvedValue(null);
      (prisma.knownDevice.create as any).mockResolvedValue({
        id: 'new-device-1',
        userId: mockUserId,
        fingerprint: 'a'.repeat(64),
        name: 'Chrome on Windows',
      });

      const result = await service.trackLogin(mockUserId, mockUserEmail, mockIP, mockUserAgent);

      expect(result).toBe(true);
    });
  });

  describe('getKnownDevices', () => {
    it('should return all known devices for a user', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          name: 'Chrome on Windows',
          firstSeen: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-15'),
        },
        {
          id: 'device-2',
          name: 'Safari on iPhone',
          firstSeen: new Date('2024-01-10'),
          lastSeen: new Date('2024-01-14'),
        },
      ];

      (prisma.knownDevice.findMany as any).mockResolvedValue(mockDevices);

      const result = await service.getKnownDevices('user-123');

      expect(result).toEqual(mockDevices);
      expect(prisma.knownDevice.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { lastSeen: 'desc' },
        select: {
          id: true,
          name: true,
          firstSeen: true,
          lastSeen: true,
        },
      });
    });

    it('should return empty array when user has no known devices', async () => {
      (prisma.knownDevice.findMany as any).mockResolvedValue([]);

      const result = await service.getKnownDevices('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('removeDevice', () => {
    it('should remove a specific device for user', async () => {
      (prisma.knownDevice.deleteMany as any).mockResolvedValue({ count: 1 });

      await service.removeDevice('user-123', 'device-1');

      expect(prisma.knownDevice.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'device-1',
          userId: 'user-123',
        },
      });
    });

    it('should ensure user can only delete their own devices', async () => {
      (prisma.knownDevice.deleteMany as any).mockResolvedValue({ count: 0 });

      await service.removeDevice('user-123', 'device-1');

      expect(prisma.knownDevice.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'device-1',
          userId: 'user-123',
        },
      });
    });
  });

  describe('removeAllDevices', () => {
    it('should remove all devices for a user', async () => {
      (prisma.knownDevice.deleteMany as any).mockResolvedValue({ count: 5 });

      await service.removeAllDevices('user-123');

      expect(prisma.knownDevice.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should handle when user has no devices', async () => {
      (prisma.knownDevice.deleteMany as any).mockResolvedValue({ count: 0 });

      await service.removeAllDevices('user-123');

      expect(prisma.knownDevice.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });
});
