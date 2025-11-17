// src/lib/subscription-utils.ts

// Free tier limits
export const FREE_TIER_LIMITS = {
  TRIAL_MONTHS: 3,
  MAX_INVOICES: 3,
};

/**
 * Check if user is on free tier and has exceeded limits
 * @param subscription - Subscription data from subscriptions table
 */
export async function checkSubscriptionLimits(
  subscription: {
    status: 'trial' | 'active' | 'canceled' | 'expired';
    plan: string;
    trial_end_date: string | null;
    invoice_count: number;
  } | null
): Promise<{
  canCreateInvoice: boolean;
  reason?: string;
  isTrialExpired?: boolean;
  hasExceededInvoiceLimit?: boolean;
}> {
  // subscriptionが存在しない場合
  if (!subscription) {
    return {
      canCreateInvoice: false,
      reason: 'サブスクリプション情報が見つかりません。',
    };
  }

  // プレミアムプランは無制限
  if (subscription.plan === 'premium') {
    return { canCreateInvoice: true };
  }

  // フリープランの制限チェック
  const now = new Date();
  const trialEndDate = subscription.trial_end_date ? new Date(subscription.trial_end_date) : null;
  const isTrialExpired = trialEndDate ? now > trialEndDate : false;

  // 請求書数チェック
  const hasExceededInvoiceLimit = subscription.invoice_count >= FREE_TIER_LIMITS.MAX_INVOICES;

  // 作成可否の判定
  const canCreateInvoice = !isTrialExpired && !hasExceededInvoiceLimit;

  if (!canCreateInvoice) {
    let reason = '';
    if (isTrialExpired && hasExceededInvoiceLimit) {
      reason = 'トライアル期間が終了し、無料枠（3通）を使い切りました。プレミアムプランにアップグレードしてください。';
    } else if (hasExceededInvoiceLimit) {
      reason = '無料枠（3通）を使い切りました。プレミアムプランにアップグレードすると無制限に作成できます。';
    } else if (isTrialExpired) {
      reason = 'トライアル期間が終了しました。プレミアムプランにアップグレードしてください。';
    }
    
    return {
      canCreateInvoice: false,
      reason,
      isTrialExpired,
      hasExceededInvoiceLimit,
    };
  }

  // トライアル中で、まだ作成可能な場合は警告
  const invoicesRemaining = FREE_TIER_LIMITS.MAX_INVOICES - subscription.invoice_count;
  
  if (invoicesRemaining > 0 && invoicesRemaining <= 2) {
    return {
      canCreateInvoice: true,
      reason: `無料枠の残りは${invoicesRemaining}通です。プレミアムプランにアップグレードすると無制限に作成できます。`,
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
    active: '有効',
    canceled: 'キャンセル済み',
    expired: '期限切れ',
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