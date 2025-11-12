// src/types/index.ts

export type UserRole = 'cast' | 'organizer' | 'both'
export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'rejected'
export type AccountType = '普通' | '当座'
export type NotificationType = 'invoice_received' | 'invoice_approved' | 'invoice_paid' | 'invoice_rejected'

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  
  // キャスト情報
  artist_name?: string
  phone?: string
  address?: string
  bank_name?: string
  branch_name?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  invoice_number?: string
  
  // 主催者情報
  organization_name?: string
  organizer_code?: string
  
  // サブスクリプション
  is_premium: boolean
  free_invoices_remaining: number
  free_trial_end: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  
  // 送信者（キャスト）
  cast_id: string
  cast_name: string
  cast_email: string
  cast_phone?: string
  cast_address?: string
  
  // 受信者（主催者）
  organizer_id?: string
  organizer_name: string
  organizer_code: string
  
  // 請求書情報
  invoice_number: string
  invoice_date: string
  payment_due_date: string
  event_name: string
  event_date?: string
  
  // 金額計算
  subtotal: number
  tax_amount: number
  withholding_tax: number
  total_amount: number
  
  // 振込先情報
  bank_name?: string
  branch_name?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  invoice_registration_number?: string
  
  // ステータス管理
  status: InvoiceStatus
  
  // メモ・備考
  notes?: string
  rejection_reason?: string
  
  // 通知
  is_read: boolean
  
  // PDF情報
  pdf_url?: string
  
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  created_at: string
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[]
}

export interface OrganizerConnection {
  id: string
  cast_id: string
  organizer_id: string
  organizer_code: string
  connected_at: string
  organizer?: Profile // リレーション
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_invoice_id?: string
  is_read: boolean
  created_at: string
}

// フォーム用の型
export interface InvoiceFormData {
  organizer_code: string
  organizer_name: string
  invoice_date: string
  payment_due_date: string
  event_name: string
  event_date?: string
  items: {
    description: string
    quantity: number
    unit_price: number
  }[]
  notes?: string
  apply_tax: boolean
  apply_withholding: boolean
}

export interface ProfileFormData {
  full_name: string
  artist_name?: string
  phone?: string
  address?: string
  bank_name?: string
  branch_name?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  invoice_number?: string
  organization_name?: string
}
