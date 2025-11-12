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
  // 1. Trial is not expired AND invoice count is under limit
  const canCreateInvoice = !isTrialExpired && !hasExceededInvoiceLimit;

  if (!canCreateInvoice) {
    let reason = '';
    if (isTrialExpired && hasExceededInvoiceLimit) {
      reason = 'トライアル期間が終了し、無料枠（3件）を使い切りました。有料プランにアップグレードしてください。';
    } else if (hasExceededInvoiceLimit) {
      reason = '無料枠（3件）を使い切りました。有料プランにアップグレードしてください。';
    } else if (isTrialExpired) {
      reason = 'トライアル期間が終了しました。有料プランにアップグレードしてください。';
    }
    
    return {
      canCreateInvoice: false,
      reason,
      isTrialExpired,
      hasExceededInvoiceLimit,
    };
  }


  // トライアル中で、まだ作成可能な場合は警告メッセージを表示
  const invoicesRemaining = FREE_TIER_LIMITS.MAX_INVOICES - profile.invoice_count;
  
  if (invoicesRemaining > 0 && invoicesRemaining <= 2) {
  // 残り1〜2件の場合は警告
    return {
      canCreateInvoice: true,
      reason: `無料枠の残りは${invoicesRemaining}件です。有料プランにアップグレードすると無制限に作成できます。`,
      isTrialExpired: false,
      hasExceededInvoiceLimit: false,
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
