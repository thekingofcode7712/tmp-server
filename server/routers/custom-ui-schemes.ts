/**
 * Custom UI Color Schemes Router
 * Allows users to create and purchase custom UI color schemes for the server interface
 * Price: £4.99 per custom scheme (one-time payment)
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// In-memory storage for demo (replace with database in production)
const customSchemes = new Map<string, any>();
const userPurchases = new Map<number, Set<string>>();

export const customUISchemeRouter = router({
  /**
   * Get all available custom UI schemes
   */
  getAll: publicProcedure.query(async () => {
    return Array.from(customSchemes.values());
  }),

  /**
   * Get user's purchased custom UI schemes
   */
  getUserSchemes: protectedProcedure.query(async ({ ctx }) => {
    const userSchemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
    const schemes = Array.from(userSchemes).map(schemeId => customSchemes.get(schemeId));
    return schemes.filter(Boolean);
  }),

  /**
   * Check if user has purchased a specific scheme
   */
  hasPurchased: protectedProcedure
    .input(z.object({ schemeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userSchemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
      return userSchemes.has(input.schemeId);
    }),

  /**
   * Create a custom UI scheme (requires payment)
   */
  createScheme: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        description: z.string().max(200),
        colors: z.record(z.string(), z.string().regex(/^#[0-9A-F]{6}$/i)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const schemeId = `scheme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const scheme = {
        id: schemeId,
        userId: ctx.user?.id,
        name: input.name,
        description: input.description,
        colors: input.colors,
        createdAt: new Date(),
        price: 499, // £4.99 in pence
        stripePaymentId: null,
      };

      customSchemes.set(schemeId, scheme);
      return scheme;
    }),

  /**
   * Generate Stripe checkout session for custom UI scheme purchase
   */
  createCheckout: protectedProcedure
    .input(z.object({ schemeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const scheme = customSchemes.get(input.schemeId);
      if (!scheme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scheme not found',
        });
      }

      // Check if already purchased
      const userSchemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
      if (userSchemes.has(input.schemeId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already purchased this scheme',
        });
      }

      try {
        const Stripe = (await import('stripe')).default;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

        const session = await stripeClient.checkout.sessions.create({
          customer_email: ctx.user?.email || undefined,
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Custom UI Scheme: ${scheme.name}`,
                  description: scheme.description,
                },
                unit_amount: 499, // £4.99
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/settings?tab=ui-schemes&success=true`,
          cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/settings?tab=ui-schemes`,
          allow_promotion_codes: true,
          metadata: {
            userId: ctx.user?.id.toString(),
            schemeId: input.schemeId,
            type: 'custom_ui_scheme',
          },
        });

        return { checkoutUrl: session.url };
      } catch (error) {
        console.error('[Custom UI Schemes] Stripe error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }
    }),

  /**
   * Save custom scheme after successful payment
   */
  saveScheme: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        schemeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      try {
        const Stripe = (await import('stripe')).default;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

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

        // Record purchase
        if (!userPurchases.has(ctx.user?.id || 0)) {
          userPurchases.set(ctx.user?.id || 0, new Set<string>());
        }
        userPurchases.get(ctx.user?.id || 0)!.add(input.schemeId);

        // Update scheme with payment info
        const scheme = customSchemes.get(input.schemeId);
        if (scheme) {
          scheme.stripePaymentId = session.payment_intent;
          scheme.purchasedBy = ctx.user?.id;
          scheme.purchasedAt = new Date();
        }

        return { success: true, schemeId: input.schemeId };
      } catch (error) {
        console.error('[Custom UI Schemes] Save error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save scheme',
        });
      }
    }),

  /**
   * Apply custom UI scheme to user's account
   */
  applyScheme: protectedProcedure
    .input(z.object({ schemeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userSchemes = userPurchases.get(ctx.user?.id || 0) || new Set<string>();
      if (!userSchemes.has(input.schemeId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this scheme',
        });
      }

      // In production, save to database
      return {
        success: true,
        schemeId: input.schemeId,
        message: 'Scheme applied successfully',
      };
    }),

  /**
   * Delete custom UI scheme
   */
  deleteScheme: protectedProcedure
    .input(z.object({ schemeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const scheme = customSchemes.get(input.schemeId);
      if (!scheme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scheme not found',
        });
      }

      if (scheme.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not own this scheme',
        });
      }

      customSchemes.delete(input.schemeId);
      userPurchases.get(ctx.user?.id || 0)?.delete(input.schemeId);

      return { success: true };
    }),

  /**
   * Get pricing information for custom UI schemes
   */
  getPricing: publicProcedure.query(async () => {
    return {
      price: 499, // £4.99 in pence
      currency: 'GBP',
      description: 'One-time payment to create and purchase a custom UI color scheme',
      features: [
        'Create custom UI color scheme',
        'Apply to your server interface',
        'One-time payment',
        'Unlimited customization',
        'Instant activation',
      ],
    };
  }),
});
