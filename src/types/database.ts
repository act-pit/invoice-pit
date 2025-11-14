export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  occupation: string | null;
  area: string | null;
  postal_code: string | null;
  address: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  invoice_reg_number: string | null;
  created_at: string;
  updated_at: string;
  // Subscription fields
  subscription_status: 'trial' | 'active' | 'inactive' | 'cancelled';
  subscription_id: string | null;
  trial_end_date: string | null;
  invoice_count: number;
  subscription_start_date: string | null;
  occupation_types: string[] | null;
  activity_areas: string[] | null;
}

export interface InvoiceItem {
  name: string;
  quantity: number;  // 個数（デフォルト：1）
  amount: number;
  category?: string; // 項目ジャンル
  isTaxIncluded?: boolean; // 税込かどうか
  isWithholdingTarget?: boolean; // 源泉徴収対象かどうか
  isTaxExempt?: boolean; // 非課税かどうか
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  work_date: string | null;
  payment_due_date: string | null;
  subject: string | null;
  recipient_name: string | null;
  recipient_type: 'company' | 'individual' | null;
  recipient_address: string | null;  // ← 追加
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  withholding: number;
  total: number;
  notes: string | null;
  status: 'draft' | 'sent' | 'paid';
  organizer_id: string | null;
  payment_status: 'unpaid' | 'paid';
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  return_status?: 'returned' | 'resubmitted' | null;
  return_comment?: string | null;
  return_date?: string | null;
  returned_by?: string | null;
}

export interface Organizer {
  id: string;
  organizer_code: string;
  name: string;
  email: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizerInvoice {
  id: string;
  organizer_id: string;
  cast_user_id: string;
  invoice_id: string | null;
  invoice_number: string;
  cast_name: string;
  cast_email: string;
  work_date: string | null;
  payment_due_date: string | null;
  subject: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  withholding: number;
  total: number;
  bank_name: string | null;
  branch_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  invoice_reg_number: string | null;
  status: 'pending' | 'approved' | 'paid' | 'returned' ;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
