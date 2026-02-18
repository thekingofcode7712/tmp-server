/**
 * Subscription Pricing Configuration
 * 
 * Flexible pricing model starting at £2.50, incrementing by £1.50 per tier
 * Special pricing for 500GB (£30) and 1TB (£64.99)
 */

export const STORAGE_SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    storage: 0, // GB
    price: 0, // pence
    description: 'Free plan with limited storage',
  },
  tier_50gb: {
    name: '50GB',
    storage: 50,
    price: 250, // £2.50
    description: '50GB cloud storage',
  },
  tier_100gb: {
    name: '100GB',
    storage: 100,
    price: 400, // £4.00 (£2.50 + £1.50)
    description: '100GB cloud storage',
  },
  tier_200gb: {
    name: '200GB',
    storage: 200,
    price: 550, // £5.50 (£4.00 + £1.50)
    description: '200GB cloud storage',
  },
  tier_500gb: {
    name: '500GB',
    storage: 500,
    price: 3000, // £30.00 (special pricing)
    description: '500GB cloud storage',
  },
  tier_1tb: {
    name: '1TB',
    storage: 1024,
    price: 6499, // £64.99 (special pricing)
    description: '1TB cloud storage',
  },
  unlimited: {
    name: 'Unlimited',
    storage: Infinity,
    price: 9999, // £99.99
    description: 'Unlimited cloud storage',
  },
};

export const EMAIL_SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    storage: 0, // GB
    price: 0, // pence
    description: 'Free email storage',
  },
  tier_50gb: {
    name: '50GB',
    storage: 50,
    price: 250, // £2.50
    description: '50GB email storage',
  },
  tier_100gb: {
    name: '100GB',
    storage: 100,
    price: 400, // £4.00
    description: '100GB email storage',
  },
  tier_200gb: {
    name: '200GB',
    storage: 200,
    price: 550, // £5.50
    description: '200GB email storage',
  },
  tier_500gb: {
    name: '500GB',
    storage: 500,
    price: 3000, // £30.00
    description: '500GB email storage',
  },
  tier_1tb: {
    name: '1TB',
    storage: 1024,
    price: 6499, // £64.99
    description: '1TB email storage',
  },
  unlimited: {
    name: 'Unlimited',
    storage: Infinity,
    price: 9999, // £99.99
    description: 'Unlimited email storage',
  },
};

/**
 * Get subscription tier by storage amount
 */
export function getStorageTierByAmount(storageGB: number): string {
  const tiers = Object.entries(STORAGE_SUBSCRIPTION_TIERS)
    .filter(([, tier]) => tier.storage >= storageGB)
    .sort((a, b) => a[1].storage - b[1].storage);

  return tiers.length > 0 ? tiers[0][0] : 'unlimited';
}

/**
 * Get price in pence for a storage tier
 */
export function getStoragePrice(tier: string): number {
  return STORAGE_SUBSCRIPTION_TIERS[tier as keyof typeof STORAGE_SUBSCRIPTION_TIERS]?.price ?? 0;
}

/**
 * Get storage limit in bytes for a tier
 */
export function getStorageLimit(tier: string): number {
  const tierConfig = STORAGE_SUBSCRIPTION_TIERS[tier as keyof typeof STORAGE_SUBSCRIPTION_TIERS];
  if (!tierConfig) return 0;
  if (tierConfig.storage === Infinity) return Infinity;
  return tierConfig.storage * 1024 * 1024 * 1024; // Convert GB to bytes
}

/**
 * Format price from pence to pounds string
 */
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Calculate profit margin for a subscription tier
 */
export function calculateProfitMargin(tier: string): number {
  const price = getStoragePrice(tier);
  // Assuming base cost of £0.50 per 100GB
  const tierConfig = STORAGE_SUBSCRIPTION_TIERS[tier as keyof typeof STORAGE_SUBSCRIPTION_TIERS];
  if (!tierConfig || tierConfig.storage === Infinity) return price;
  
  const baseCost = (tierConfig.storage / 100) * 50; // 50 pence per 100GB
  return price - baseCost;
}
