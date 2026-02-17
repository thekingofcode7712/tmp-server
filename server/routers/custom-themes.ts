/**
 * Custom Themes Router
 * Handles paid custom theme creation and purchases
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const CUSTOM_THEME_PRICE = 499; // £4.99 in pence

interface CustomTheme {
  id: string;
  userId: number;
  name: string;
  colors: Record<string, string>;
  createdAt: Date;
  stripePaymentId: string | null;
}

// In-memory storage for demo (replace with database in production)
const customThemes: Map<string, CustomTheme> = new Map();
const userPurchases: Map<number, Set<string>> = new Map();

export const customThemesRouter = router({
  /**
   * Create a checkout session for custom theme purchase
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        themeName: z.string().min(1).max(50),
        colors: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

      try {
        const sessionConfig: any = {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Custom Theme: ${input.themeName}`,
                  description: 'Create and save a custom theme with your own color scheme',
                },
                unit_amount: CUSTOM_THEME_PRICE,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/themes/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/themes/editor`,
          customer_email: ctx.user?.email || undefined,
          client_reference_id: ctx.user?.id.toString(),
          metadata: {
            userId: ctx.user?.id.toString(),
            themeName: input.themeName,
            colors: JSON.stringify(input.colors),
            type: 'custom_theme',
          },
        };
        const session = await (stripeClient.checkout.sessions.create as any)(sessionConfig);

        return {
          sessionId: session.id,
          url: session.url || '',
          success: true,
        };
      } catch (error) {
        console.error('[Custom Themes] Checkout session creation failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  /**
   * Get user's custom themes
   */
  getUserThemes: protectedProcedure.query(async ({ ctx }) => {
    const userThemes = Array.from(customThemes.values()).filter(
      theme => theme.userId === ctx.user?.id
    );

    return {
      themes: userThemes,
      total: userThemes.length,
    };
  }),

  /**
   * Get a specific custom theme
   */
  getTheme: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const theme = customThemes.get(input.themeId);

      if (!theme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        });
      }

      if (theme.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this theme',
        });
      }

      return theme;
    }),

  /**
   * Check if user has purchased a specific theme
   */
  hasPurchased: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userPurchasedThemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
      return userPurchasedThemes.has(input.themeId);
    }),

  /**
   * Save custom theme after successful payment
   */
  saveTheme: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        themeName: z.string(),
        colors: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

      try {
        // Verify the session
        const session = await (stripeClient.checkout.sessions.retrieve as any)(input.sessionId);

        if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payment not completed',
          });
        }

        if (session.client_reference_id !== ctx.user?.id.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Session does not match user',
          });
        }

        // Create and save the theme
        const themeId = `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const customTheme: CustomTheme = {
          id: themeId,
          userId: ctx.user?.id || 0,
          name: input.themeName,
          colors: input.colors as Record<string, string>,
          createdAt: new Date(),
          stripePaymentId: (session.payment_intent as string) || null,
        };

        customThemes.set(themeId, customTheme);

        // Track purchase
        const userPurchasedThemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
        userPurchasedThemes.add(themeId);
        userPurchases.set(ctx.user?.id || 0, userPurchasedThemes);

        console.log(`[Custom Themes] Theme saved: ${themeId} for user ${ctx.user?.id}`);

        return {
          success: true,
          themeId,
          message: 'Theme saved successfully',
        };
      } catch (error) {
        console.error('[Custom Themes] Theme save failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save theme',
        });
      }
    }),

  /**
   * Delete a custom theme
   */
  deleteTheme: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const theme = customThemes.get(input.themeId);

      if (!theme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        });
      }

      if (theme.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this theme',
        });
      }

      customThemes.delete(input.themeId);

      const userPurchasedThemes = userPurchases.get(ctx.user?.id || 0);
      if (userPurchasedThemes) {
        userPurchasedThemes.delete(input.themeId);
      }

      return { success: true, message: 'Theme deleted' };
    }),

  /**
   * Get pricing information
   */
  getPricing: protectedProcedure.query(async () => {
    return {
      price: CUSTOM_THEME_PRICE / 100, // Convert to pounds
      currency: 'GBP',
      description: 'One-time payment to create and save a custom theme',
      features: [
        'Save custom theme permanently',
        'Apply to your account',
        'One-time payment',
        'Unlimited color customization',
      ],
    };
  }),
});

export default customThemesRouter;
