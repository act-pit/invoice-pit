import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Price ID for annual subscription (¥1,980/year)
export const ANNUAL_PRICE_ID = process.env.STRIPE_PRICE_TALENT_PREMIUM || '';

// Re-export subscription utilities
export { 
  checkSubscriptionLimits, 
  formatSubscriptionStatus, 
  getTrialDaysRemaining,
  FREE_TIER_LIMITS 
} from './subscription-utils';
