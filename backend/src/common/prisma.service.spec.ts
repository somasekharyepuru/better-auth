import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(async () => {
    await service.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    expect(service).toBeInstanceOf(Object);
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
  });

  it('should have access to Prisma models', () => {
    expect(service.user).toBeDefined();
    expect(service.organization).toBeDefined();
    expect(service.session).toBeDefined();
    expect(service.member).toBeDefined();
    expect(service.auditLog).toBeDefined();
  });

  describe('OnModuleInit', () => {
    it('should connect to database on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('OnModuleDestroy', () => {
    it('should disconnect from database on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('lifecycle hooks', () => {
    it('should implement OnModuleInit', () => {
      expect(service.onModuleInit).toBeDefined();
    });

    it('should implement OnModuleDestroy', () => {
      expect(service.onModuleDestroy).toBeDefined();
    });
  });
});
