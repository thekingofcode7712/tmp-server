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
} as const;

export type ProductId = keyof typeof PRODUCTS;
