import type { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";
import { PRODUCTS } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log("[Webhook] Received event:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const metadata = session.metadata || {};

  if (!userId) {
    console.error("[Webhook] No user ID in checkout session");
    return;
  }

  const userIdNum = parseInt(userId);
  
  // Check if this is an addon purchase
  if (metadata.type === 'addon_purchase') {
    const addonId = metadata.addon_id;
    if (!addonId) {
      console.error("[Webhook] No addon ID in checkout session");
      return;
    }
    
    // Get addon from database by name
    const addonName = addonId.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const addon = await db.getAddonByName(addonName);
    if (!addon) {
      console.error("[Webhook] Addon not found:", addonName);
      return;
    }
    
    // Record payment
    await db.createPayment({
      userId: userIdNum,
      stripePaymentIntentId: session.payment_intent as string,
      amount: 300, // £3
      currency: 'gbp',
      status: 'succeeded',
      description: `Addon: ${addonName}`,
    });
    
    // Grant addon to user
    await db.purchaseAddon(userIdNum, addon.id, session.payment_intent as string);
    
    console.log(`[Webhook] Addon ${addonName} granted to user ${userIdNum}`);
    return;
  }
  
  const planId = metadata.plan_id as keyof typeof PRODUCTS;

  if (!planId || !PRODUCTS[planId]) {
    console.error("[Webhook] Invalid plan ID:", planId);
    return;
  }

  const product = PRODUCTS[planId];

  // Record payment
  await db.createPayment({
    userId: userIdNum,
    stripePaymentIntentId: session.payment_intent as string,
    amount: session.amount_total || 0,
    currency: session.currency || "gbp",
    status: "succeeded",
    description: `${product.name} - ${planId}`,
  });

  // Handle one-time purchases
  if (planId === "customization") {
    await db.updateUserCustomization(userIdNum, {
      hasCustomization: true,
    });
    console.log(`[Webhook] Enabled customization for user ${userIdNum}`);
    return;
  }

  // Handle credit purchases
  if (planId.startsWith("credits_")) {
    if ('credits' in product && typeof product.credits === 'number') {
      const user = await db.getUserById(userIdNum);
      if (user) {
        await db.updateUserAICredits(userIdNum, user.aiCredits + product.credits);
        console.log(`[Webhook] Added ${product.credits} credits for user ${userIdNum}`);
      }
    }
    return;
  }

  // Handle subscriptions
  if (session.subscription) {
    const subscriptionId = session.subscription as string;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.createSubscription({
      userId: userIdNum,
      stripeSubscriptionId: subscriptionId,
      tier: planId as any,
      status: "active",
      currentPeriodEnd: expiresAt,
    });

    if ('storage' in product) {
      await db.updateUserSubscription(
        userIdNum,
        planId,
        product.storage,
        expiresAt
      );
    }

    // Add AI credits
    if ('aiCredits' in product && typeof product.aiCredits === "number") {
      const user = await db.getUserById(userIdNum);
      if (user) {
        await db.updateUserAICredits(userIdNum, user.aiCredits + product.aiCredits);
      }
    }

    console.log(`[Webhook] Activated subscription ${planId} for user ${userIdNum}`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) return;

  const subscription = await db.getSubscriptionByStripeId(subscriptionId);
  if (!subscription) {
    console.error("[Webhook] Subscription not found:", subscriptionId);
    return;
  }

  const product = PRODUCTS[subscription.tier as keyof typeof PRODUCTS];
  if (!product || !('storage' in product)) return;

  // Renew subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await db.updateSubscription(subscription.id, {
    status: "active",
    currentPeriodEnd: expiresAt,
  });

  await db.updateUserSubscription(
    subscription.userId,
    subscription.tier,
    product.storage,
    expiresAt
  );

  // Add monthly AI credits
  if ('aiCredits' in product && typeof product.aiCredits === "number") {
    const user = await db.getUserById(subscription.userId);
    if (user) {
      await db.updateUserAICredits(subscription.userId, user.aiCredits + product.aiCredits);
    }
  }

  console.log(`[Webhook] Renewed subscription for user ${subscription.userId}`);
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscription = await db.getSubscriptionByStripeId(stripeSubscription.id);
  if (!subscription) return;

  await db.updateSubscription(subscription.id, {
    status: stripeSubscription.status as any,
  });

  console.log(`[Webhook] Updated subscription status: ${stripeSubscription.status}`);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await db.getSubscriptionByStripeId(stripeSubscription.id);
  if (!subscription) return;

  await db.updateSubscription(subscription.id, {
    status: "cancelled",
  });

  // Downgrade to free plan
  await db.updateUserSubscription(
    subscription.userId,
    "free",
    5368709120, // 5GB
    new Date()
  );

  console.log(`[Webhook] Canceled subscription for user ${subscription.userId}`);
}
