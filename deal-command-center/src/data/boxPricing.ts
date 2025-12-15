import type { ProductTier, AddOn } from '../types';

interface TierPricing {
  monthlyPerUser: number;
  annualPerUser: number;
  note?: string;
}

interface AddOnPricing {
  monthlyPerUser: number;
  annualPerUser: number;
  note: string;
}

export const boxPricing: {
  tiers: Record<ProductTier, TierPricing>;
  addOns: Record<AddOn, AddOnPricing>;
} = {
  tiers: {
    business: { monthlyPerUser: 15, annualPerUser: 180 },
    business_plus: { monthlyPerUser: 25, annualPerUser: 300 },
    enterprise: { monthlyPerUser: 35, annualPerUser: 420 },
    enterprise_plus: { monthlyPerUser: 47, annualPerUser: 564 },
    enterprise_advanced: { monthlyPerUser: 0, annualPerUser: 0, note: 'Custom pricing' },
  },
  addOns: {
    box_ai: { monthlyPerUser: 0, annualPerUser: 0, note: 'Included in E+ and above, custom for others' },
    shield: { monthlyPerUser: 0, annualPerUser: 0, note: 'Custom pricing based on tier' },
    governance: { monthlyPerUser: 0, annualPerUser: 0, note: 'Custom pricing' },
    sign: { monthlyPerUser: 0, annualPerUser: 0, note: 'Transaction-based pricing' },
    relay: { monthlyPerUser: 0, annualPerUser: 0, note: 'Included in Enterprise+' },
    platform: { monthlyPerUser: 0, annualPerUser: 0, note: 'API calls pricing' },
  },
};

// Feature comparison by tier
export const tierFeatures: Record<ProductTier, string[]> = {
  business: [
    '100GB storage per user',
    'Standard security',
    'Office 365 integration',
    'Mobile access',
  ],
  business_plus: [
    'Unlimited storage',
    'External collaboration',
    'Advanced admin controls',
    'Custom branding',
  ],
  enterprise: [
    'Unlimited storage',
    'Advanced security policies',
    'Watermarking',
    'Device trust',
    'SSO support',
  ],
  enterprise_plus: [
    'All Enterprise features',
    'Box Relay workflows',
    'Advanced metadata',
    'Box AI included',
    'Premium support',
  ],
  enterprise_advanced: [
    'All Enterprise+ features',
    'Custom integrations',
    'Dedicated support',
    'Custom SLAs',
  ],
};
