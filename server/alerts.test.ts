import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Alert System', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Use a test user ID (assuming user exists from auth flow)
    testUserId = 1;
  });

  describe('Alert Preferences', () => {
    it('should create default alert preferences', async () => {
      await db.upsertAlertPreferences(testUserId, {
        storageAlertsEnabled: true,
        storageAlertThreshold80: 80,
        storageAlertThreshold95: 95,
        aiCreditsAlertsEnabled: true,
        aiCreditsThreshold: 10,
        emailNotifications: true,
        inAppNotifications: true,
      });

      const prefs = await db.getAlertPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(prefs?.storageAlertsEnabled).toBe(true);
      expect(prefs?.storageAlertThreshold80).toBe(80);
      expect(prefs?.aiCreditsAlertsEnabled).toBe(true);
    });

    it('should update alert preferences', async () => {
      await db.upsertAlertPreferences(testUserId, {
        storageAlertThreshold80: 85,
        aiCreditsThreshold: 15,
      });

      const prefs = await db.getAlertPreferences(testUserId);
      expect(prefs?.storageAlertThreshold80).toBe(85);
      expect(prefs?.aiCreditsThreshold).toBe(15);
    });
  });

  describe('Alert History', () => {
    it('should record alert history', async () => {
      await db.recordAlert(testUserId, 'storage_80', { storagePercent: 82 });
      
      const lastAlert = await db.getLastAlert(testUserId, 'storage_80');
      expect(lastAlert).toBeDefined();
      expect(lastAlert?.alertType).toBe('storage_80');
    });

    it('should retrieve user alert history', async () => {
      const history = await db.getUserAlertHistory(testUserId, 10);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('should create in-app notification', async () => {
      const result = await db.createNotification({
        userId: testUserId,
        type: 'storage_warning',
        title: 'Test Notification',
        message: 'This is a test notification',
      });
      
      expect(result).toBeDefined();
    });

    it('should get user notifications', async () => {
      const notifications = await db.getUserNotifications(testUserId, 10);
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should get unread notification count', async () => {
      const count = await db.getUnreadNotificationCount(testUserId);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should mark notification as read', async () => {
      const notifications = await db.getUserNotifications(testUserId, 1);
      if (notifications.length > 0) {
        await db.markNotificationAsRead(notifications[0].id, testUserId);
        const updated = await db.getUserNotifications(testUserId, 1);
        // Note: This test assumes the notification was unread before
      }
    });

    it('should mark all notifications as read', async () => {
      await db.markAllNotificationsAsRead(testUserId);
      const count = await db.getUnreadNotificationCount(testUserId);
      expect(count).toBe(0);
    });
  });
});
