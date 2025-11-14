import type { Profile } from '@/types/database';

/**
 * プロフィールが完了しているかチェック
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;

  // 必須項目：名前、住所、振込先
  const hasBasicInfo = !!(
    profile.full_name &&
    profile.postal_code &&
    profile.address
  );

  const hasBankInfo = !!(
    profile.bank_name &&
    profile.branch_name &&
    profile.account_type &&
    profile.account_number &&
    profile.account_holder
  );

  return hasBasicInfo && hasBankInfo;
}

/**
 * 未登録の項目をリストアップ
 */
export function getMissingProfileFields(profile: Profile | null): string[] {
  const missing: string[] = [];

  if (!profile) return ['全ての情報'];

  if (!profile.full_name) missing.push('お名前');
  if (!profile.postal_code) missing.push('郵便番号');
  if (!profile.address) missing.push('住所');
  if (!profile.bank_name) missing.push('銀行名');
  if (!profile.branch_name) missing.push('支店名');
  if (!profile.account_type) missing.push('口座種別');
  if (!profile.account_number) missing.push('口座番号');
  if (!profile.account_holder) missing.push('口座名義');

  return missing;
}
