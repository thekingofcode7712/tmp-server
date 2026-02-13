#!/usr/bin/env node
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const EMAIL_PRODUCTS = [
  {
    id: 'price_email_50gb',
    name: '50GB Email Storage',
    amount: 299, // £2.99
    interval: 'month',
  },
  {
    id: 'price_email_100gb',
    name: '100GB Email Storage',
    amount: 399, // £3.99
    interval: 'month',
  },
  {
    id: 'price_email_200gb',
    name: '200GB Email Storage',
    amount: 1099, // £10.99
    interval: 'month',
  },
  {
    id: 'price_email_unlimited',
    name: 'Unlimited Email Storage',
    amount: 10000, // £100
    interval: 'month',
  },
];

console.log('Creating Stripe products and prices for email storage...\n');

for (const productConfig of EMAIL_PRODUCTS) {
  try {
    // Check if price already exists
    try {
      const existingPrice = await stripe.prices.retrieve(productConfig.id);
      console.log(`✓ Price ${productConfig.id} already exists`);
      continue;
    } catch (err) {
      // Price doesn't exist, create it
    }

    // Create product first
    const product = await stripe.products.create({
      name: productConfig.name,
      description: `${productConfig.name} subscription plan`,
    });

    console.log(`✓ Created product: ${product.name}`);

    // Create price with custom ID
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: productConfig.amount,
      currency: 'gbp',
      recurring: {
        interval: productConfig.interval,
      },
      lookup_key: productConfig.id,
    });

    console.log(`✓ Created price: ${productConfig.id} (${price.id})`);
    console.log(`  Note: Use price ID "${price.id}" in your code, or use lookup_key "${productConfig.id}"\n`);
  } catch (error) {
    console.error(`✗ Error creating ${productConfig.id}:`, error.message);
  }
}

console.log('\n✅ Done! Update your EmailStoragePlans.tsx to use the actual Stripe price IDs shown above.');
