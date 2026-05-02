import { formatDate, dailyReviewApi } from './daymark-api';

describe('dailyReviewApi.upsert', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'review-1' }),
    });
    global.fetch = mockFetch;
  });

  it('sends lifeAreaId in body when provided', async () => {
    await dailyReviewApi.upsert('2026-04-30', { wentWell: 'great' }, 'la-1');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.lifeAreaId).toBe('la-1');
  });

  it('does not include lifeAreaId when omitted', async () => {
    await dailyReviewApi.upsert('2026-04-30', { wentWell: 'ok' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.lifeAreaId).toBeUndefined();
  });
});

describe('formatDate', () => {
  it('formats Date object to YYYY-MM-DD', () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    expect(formatDate(date)).toBe('2024-06-15');
  });

  it('formats string date', () => {
    expect(formatDate('2024-01-01')).toBe('2024-01-01');
  });

  it('formats ISO string', () => {
    expect(formatDate('2024-12-25T10:30:00.000Z')).toMatch(/^2024-12-2[45]$/);
  });

  it('pads single digit months and days', () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024
    expect(formatDate(date)).toBe('2024-01-05');
  });

  it('handles timestamp number', () => {
    const timestamp = new Date(2024, 2, 1).getTime(); // Mar 1, 2024
    expect(formatDate(timestamp)).toBe('2024-03-01');
  });
});
