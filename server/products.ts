// Stripe Products and Prices Configuration for TMP Server

export const PRODUCTS = {
  // Storage Plans
  "50gb": {
    name: "50GB Plan",
    price: 299, // in pence (£2.99)
    currency: "gbp",
    interval: "month",
    storage: 53687091200, // 50GB in bytes
    aiCredits: 500,
  },
  "100gb": {
    name: "100GB Plan",
    price: 399, // £3.99
    currency: "gbp",
    interval: "month",
    storage: 107374182400, // 100GB in bytes
    aiCredits: 1000,
  },
  "200gb": {
    name: "200GB Plan",
    price: 1099, // £10.99
    currency: "gbp",
    interval: "month",
    storage: 214748364800, // 200GB in bytes
    aiCredits: 2000,
  },
  "500gb": {
    name: "500GB Plan",
    price: 2599, // £25.99
    currency: "gbp",
    interval: "month",
    storage: 536870912000, // 500GB in bytes
    aiCredits: 5000,
  },
  "1tb": {
    name: "1TB Plan",
    price: 5000, // £50
    currency: "gbp",
    interval: "month",
    storage: 1099511627776, // 1TB in bytes
    aiCredits: 10000,
  },
  "2tb": {
    name: "2TB Plan",
    price: 8999, // £89.99
    currency: "gbp",
    interval: "month",
    storage: 2199023255552, // 2TB in bytes
    aiCredits: 20000,
  },
  "unlimited": {
    name: "Unlimited Plan",
    price: 10000, // £100
    currency: "gbp",
    interval: "month",
    storage: Number.MAX_SAFE_INTEGER, // Unlimited
    aiCredits: Number.MAX_SAFE_INTEGER, // Unlimited
  },

  // One-time purchases
  "customization": {
    name: "Custom Branding",
    price: 1999, // £19.99
    currency: "gbp",
    interval: null, // One-time payment
  },

  // Email Storage Plans
  "email_25gb": {
    name: "25GB Email Storage",
    price: 199, // £1.99/month
    currency: "gbp",
    interval: "month",
    emailStorage: 26843545600, // 25GB in bytes
  },
  "email_50gb": {
    name: "50GB Email Storage",
    price: 349, // £3.49/month
    currency: "gbp",
    interval: "month",
    emailStorage: 53687091200, // 50GB in bytes
  },
  "email_100gb": {
    name: "100GB Email Storage",
    price: 599, // £5.99/month
    currency: "gbp",
    interval: "month",
    emailStorage: 107374182400, // 100GB in bytes
  },
  "email_unlimited": {
    name: "Unlimited Email Storage",
    price: 999, // £9.99/month
    currency: "gbp",
    interval: "month",
    emailStorage: Number.MAX_SAFE_INTEGER, // Unlimited
  },

  // AI Credit Packs
  "credits_1000": {
    name: "1000 AI Credits",
    price: 499, // £4.99
    currency: "gbp",
    interval: null,
    credits: 1000,
  },
  "credits_3000": {
    name: "3000 AI Credits",
    price: 599, // £5.99
    currency: "gbp",
    interval: null,
    credits: 3000,
  },
  "credits_10000": {
    name: "10000 AI Credits",
    price: 1299, // £12.99
    currency: "gbp",
    interval: null,
    credits: 10000,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
