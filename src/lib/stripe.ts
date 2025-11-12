import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any,
  typescript: true,
});

// Price ID for annual subscription (¥980/year)
export const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '';

// Free tier limits
export const FREE_TIER_LIMITS = {
  TRIAL_MONTHS: 3,
  MAX_INVOICES: 3,
};

/**
 * Check if user is on free tier and has exceeded limits
 */
export async function checkSubscriptionLimits(
  profile: {
    subscription_status: string;
    trial_end_date: string | null;
    invoice_count: number;
  }
): Promise<{
  canCreateInvoice: boolean;
  reason?: string;
  isTrialExpired?: boolean;
  hasExceededInvoiceLimit?: boolean;
}> {
  // If user has active subscription, no limits
  if (profile.subscription_status === 'active') {
    return { canCreateInvoice: true };
  }

  // Check trial period
  const now = new Date();
  const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isTrialExpired = trialEndDate ? now > trialEndDate : false;

  // Check invoice count
  const hasExceededInvoiceLimit = profile.invoice_count >= FREE_TIER_LIMITS.MAX_INVOICES;

  // User can create invoice if:
  // 1. Trial is not expired OR
  // 2. Invoice count is under limit
  const canCreateInvoice = !isTrialExpired || !hasExceededInvoiceLimit;

  if (!canCreateInvoice) {
    return {
      canCreateInvoice: false,
      reason: 'トライアル期間が終了し、無料枠（3件）を使い切りました。有料プランにアップグレードしてください。',
      isTrialExpired,
      hasExceededInvoiceLimit,
    };
  }

  // If trial expired but still has invoice count left
  if (isTrialExpired && !hasExceededInvoiceLimit) {
    return {
      canCreateInvoice: true,
      reason: `トライアル期間は終了していますが、残り${FREE_TIER_LIMITS.MAX_INVOICES - profile.invoice_count}件まで請求書を作成できます。`,
      isTrialExpired,
      hasExceededInvoiceLimit: false,
    };
  }

  // If invoice limit exceeded but trial not expired
  if (hasExceededInvoiceLimit && !isTrialExpired) {
    return {
      canCreateInvoice: true,
      reason: '無料枠（3件）を使い切りましたが、トライアル期間中は引き続き作成できます。',
      isTrialExpired: false,
      hasExceededInvoiceLimit,
    };
  }

  return { canCreateInvoice: true };
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    trial: 'トライアル中',
    active: '有料プラン',
    inactive: '無効',
    cancelled: 'キャンセル済み',
  };
  return statusMap[status] || status;
}

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(trialEndDate: string | null): number | null {
  if (!trialEndDate) return null;
  
  const now = new Date();
  const end = new Date(trialEndDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}
