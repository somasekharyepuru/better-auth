import { DailyReviewController } from './daily-review.controller';

describe('DailyReviewController', () => {
  const mockReview = { id: 'review-1', wentWell: 'great', didntGoWell: null, dayId: 'day-1' };

  const dailyReviewService = {
    upsertReview: jest.fn().mockResolvedValue(mockReview),
    carryForwardPriorities: jest.fn().mockResolvedValue({ carried: 1, skipped: 0, priorities: [] }),
  } as any;

  const req = { userId: 'user-1' } as any;

  let controller: DailyReviewController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DailyReviewController(dailyReviewService);
  });

  describe('PUT days/:date/review', () => {
    it('passes lifeAreaId from body to service', async () => {
      await controller.upsertReview(
        '2026-04-30',
        { wentWell: 'great', lifeAreaId: 'la-1' },
        req,
      );

      expect(dailyReviewService.upsertReview).toHaveBeenCalledWith(
        'user-1',
        '2026-04-30',
        { wentWell: 'great' },
        'la-1',
      );
    });

    it('passes undefined lifeAreaId when not in body', async () => {
      await controller.upsertReview('2026-04-30', { wentWell: 'ok' }, req);

      expect(dailyReviewService.upsertReview).toHaveBeenCalledWith(
        'user-1',
        '2026-04-30',
        { wentWell: 'ok' },
        undefined,
      );
    });
  });
});
