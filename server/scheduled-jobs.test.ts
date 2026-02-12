import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';
import { sendEmail } from './email-service';

// Mock dependencies
vi.mock('./db');
vi.mock('./email-service');
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    subscriptions: {
      update: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe('Scheduled Jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autoResumeSubscriptions', () => {
    it('should resume expired paused subscriptions', async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            tier: '100gb',
            status: 'paused',
            pausedUntil: new Date(Date.now() - 1000),
            stripeSubscriptionId: 'sub_123',
          },
        ]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
      vi.mocked(db.getUserById).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      } as any);
      vi.mocked(db.updateSubscriptionStatus).mockResolvedValue(undefined);
      vi.mocked(db.updateSubscriptionPausedUntil).mockResolvedValue(undefined);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });

      const { autoResumeSubscriptions } = await import('./scheduled-jobs');
      await autoResumeSubscriptions();

      // Verify subscription was updated
      expect(db.updateSubscriptionStatus).toHaveBeenCalledWith(1, 'active');
      expect(db.updateSubscriptionPausedUntil).toHaveBeenCalledWith(1, null);
      
      // Verify email was sent
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Your TMP Server Subscription Has Resumed',
        })
      );
    });
  });

  describe('checkUsageAlerts', () => {
    it('should send storage alert at 95%', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            storageUsed: 95 * 1024 * 1024 * 1024, // 95GB
            storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
            aiCredits: 50,
          },
        ]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });

      const { checkUsageAlerts } = await import('./scheduled-jobs');
      await checkUsageAlerts();

      // Verify 95% storage alert was sent
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '⚠️ Storage Almost Full - 95% Used',
        })
      );
    });

    it('should send storage alert at 80%', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            storageUsed: 80 * 1024 * 1024 * 1024, // 80GB
            storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
            aiCredits: 50,
          },
        ]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });

      const { checkUsageAlerts } = await import('./scheduled-jobs');
      await checkUsageAlerts();

      // Verify 80% storage alert was sent
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '⚠️ Storage Warning - 80% Used',
        })
      );
    });

    it('should send AI credits alert when below 10', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            storageUsed: 10 * 1024 * 1024 * 1024, // 10GB
            storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
            aiCredits: 5,
          },
        ]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });

      const { checkUsageAlerts } = await import('./scheduled-jobs');
      await checkUsageAlerts();

      // Verify AI credits alert was sent
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '⚠️ AI Credits Running Low',
        })
      );
    });
  });
});
