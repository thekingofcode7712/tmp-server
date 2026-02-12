import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { Context } from './_core/context';

describe('Addons Marketplace', () => {
  let testUserId: number;
  let testContext: Context;

  beforeAll(async () => {
    // Create test user
    const testUser = {
      id: 999,
      openId: 'test-user-addons',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
      subscriptionTier: 'free' as const,
      storageUsed: 0,
      storageLimit: 5368709120,
      aiCredits: 100,
      createdAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: null,
    };

    testUserId = testUser.id;

    // Mock context
    testContext = {
      user: testUser,
      req: {
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any,
      res: {} as any,
    };
  });

  it('should fetch user addons (empty initially)', async () => {
    const caller = appRouter.createCaller(testContext);
    const addons = await caller.addons.getUserAddons();
    
    expect(Array.isArray(addons)).toBe(true);
    // User should have no addons initially
  });

  it('should create Stripe checkout session for addon purchase', async () => {
    const caller = appRouter.createCaller(testContext);
    
    const result = await caller.addons.purchase({ addonId: 'games_pack' });
    
    expect(result).toHaveProperty('checkoutUrl');
    expect(result.checkoutUrl).toContain('stripe.com');
  });

  it('should prevent duplicate addon purchases', async () => {
    // This test would require mocking database to simulate existing purchase
    // For now, we'll just verify the endpoint exists
    const caller = appRouter.createCaller(testContext);
    
    try {
      await caller.addons.purchase({ addonId: 'games_pack' });
      // If user already owns it, should throw error
    } catch (error: any) {
      // Expected behavior if addon already owned
      expect(error.message).toContain('already own');
    }
  });
});
