// サブスクリプション関連のユーティリティ関数

export const PLAN_FEATURES = {
  free: {
    invoice_receive: true,
    basic_management: true,
    reject_function: false,       // ❌ フリーでは使えない
    csv_export: false,            // ❌ フリーでは使えない
    alert_display: false,         // ❌ フリーでは使えない
    approval_list: false,         // ❌ フリーでは使えない
  },
  basic: {
    invoice_receive: true,
    basic_management: true,
    reject_function: true,        // ✅ ベーシック以上
    csv_export: true,             // ✅ ベーシック以上
    alert_display: true,          // ✅ ベーシック以上
    approval_list: true,          // ✅ ベーシック以上
  },
  advance: {
    invoice_receive: true,
    basic_management: true,
    reject_function: true,
    csv_export: true,
    alert_display: true,
    approval_list: true,
  },
  pro: {
    invoice_receive: true,
    basic_management: true,
    reject_function: true,
    csv_export: true,
    alert_display: true,
    approval_list: true,
  }
} as const;

export type PlanType = keyof typeof PLAN_FEATURES;
export type FeatureType = keyof typeof PLAN_FEATURES.free;

/**
 * ユーザーのプランで特定機能が使用可能かチェック
 */
export const canUseFeature = (
  userPlan: string | null | undefined, 
  feature: FeatureType
): boolean => {
  // プランが不明な場合はフリープランとして扱う
  if (!userPlan || !(userPlan in PLAN_FEATURES)) {
    return PLAN_FEATURES.free[feature];
  }
  
  return PLAN_FEATURES[userPlan as PlanType][feature];
};

// 🗑️ この関数は削除 (モーダル制御はコンポーネント内で行う)
// export const showUpgradeAlert = ...
