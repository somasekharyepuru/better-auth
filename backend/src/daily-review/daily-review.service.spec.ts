import { DailyReviewService } from './daily-review.service';

describe('DailyReviewService', () => {
  const mockDailyReview = { id: 'review-1', wentWell: null, didntGoWell: null, dayId: 'day-1' };

  const prisma = {
    dailyReview: {
      upsert: jest.fn().mockResolvedValue(mockDailyReview),
    },
  } as any;

  const daysService = {
    getOrCreateDay: jest.fn(),
  } as any;

  let service: DailyReviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DailyReviewService(prisma, daysService);
  });

  describe('upsertReview', () => {
    it('uses null lifeAreaId day when no lifeAreaId given', async () => {
      daysService.getOrCreateDay.mockResolvedValue({ id: 'day-null' });

      await service.upsertReview('user-1', '2026-04-30', { wentWell: 'good' });

      expect(daysService.getOrCreateDay).toHaveBeenCalledWith('user-1', '2026-04-30', null);
      expect(prisma.dailyReview.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { dayId: 'day-null' } }),
      );
    });

    it('uses life-area-specific day when lifeAreaId given', async () => {
      daysService.getOrCreateDay.mockResolvedValue({ id: 'day-la1' });

      await service.upsertReview('user-1', '2026-04-30', { wentWell: 'great' }, 'la-1');

      expect(daysService.getOrCreateDay).toHaveBeenCalledWith('user-1', '2026-04-30', 'la-1');
      expect(prisma.dailyReview.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { dayId: 'day-la1' } }),
      );
    });

    it('review saved to different days for different life areas on same date', async () => {
      daysService.getOrCreateDay
        .mockResolvedValueOnce({ id: 'day-la1' })
        .mockResolvedValueOnce({ id: 'day-la2' });

      await service.upsertReview('user-1', '2026-04-30', { wentWell: 'la1 win' }, 'la-1');
      await service.upsertReview('user-1', '2026-04-30', { wentWell: 'la2 win' }, 'la-2');

      const calls = prisma.dailyReview.upsert.mock.calls;
      expect(calls[0][0].where.dayId).toBe('day-la1');
      expect(calls[1][0].where.dayId).toBe('day-la2');
    });
  });
});
