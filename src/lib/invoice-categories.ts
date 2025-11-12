export interface InvoiceCategory {
  id: string;
  label: string;
  isTaxIncluded: boolean; // 税込かどうか
  isWithholdingTarget: boolean; // 源泉徴収対象かどうか
  isTaxExempt: boolean; // 非課税かどうか
  withholdingRate?: number; // 源泉徴収率（%）
}

export const INVOICE_CATEGORIES: InvoiceCategory[] = [
  {
    id: 'performance_fee',
    label: '出演料',
    isTaxIncluded: false,
    isWithholdingTarget: true,
    isTaxExempt: false,
    withholdingRate: 10.21,
  },
  {
    id: 'ticket_back',
    label: 'チケットバック',
    isTaxIncluded: true,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
  {
    id: 'royalty',
    label: 'ロイヤリティ',
    isTaxIncluded: true,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
  {
    id: 'music_performance',
    label: '演奏料',
    isTaxIncluded: false,
    isWithholdingTarget: true,
    isTaxExempt: false,
    withholdingRate: 10.21,
  },
  {
    id: 'music_production',
    label: '楽曲制作料',
    isTaxIncluded: false,
    isWithholdingTarget: true,
    isTaxExempt: false,
    withholdingRate: 10.21,
  },
  {
    id: 'production_commission',
    label: '制作業務委託費',
    isTaxIncluded: false,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
  {
    id: 'honorarium',
    label: '謝礼',
    isTaxIncluded: true,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
  {
    id: 'transportation',
    label: '交通費',
    isTaxIncluded: false,
    isWithholdingTarget: false,
    isTaxExempt: true,
  },
  {
    id: 'discount',
    label: '値引き',
    isTaxIncluded: true,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
  {
    id: 'other',
    label: 'その他',
    isTaxIncluded: false,
    isWithholdingTarget: false,
    isTaxExempt: false,
  },
];


/**
 * カテゴリーIDから設定を取得
 */
export function getCategoryById(id: string): InvoiceCategory | undefined {
  return INVOICE_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * 源泉徴収額を計算
 */
export function calculateWithholding(amount: number, rate: number): number {
  return Math.floor(amount * (rate / 100));
}
