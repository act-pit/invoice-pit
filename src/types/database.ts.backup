// src/types/database.ts
// 完全再構築版 - データベーススキーマと完全一致（subscriptionsテーブル更新）

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          bank_name: string | null
          bank_branch: string | null
          account_type: string | null
          account_number: string | null
          account_holder: string | null
          postal_code: string | null
          address: string | null
          phone: string | null
          invoice_note: string | null
          occupation: string | null
          area: string | null
          occupation_types: string[] | null
          activity_areas: string[] | null
          branch_name: string | null
          invoice_reg_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          bank_name?: string | null
          bank_branch?: string | null
          account_type?: string | null
          account_number?: string | null
          account_holder?: string | null
          postal_code?: string | null
          address?: string | null
          phone?: string | null
          invoice_note?: string | null
          occupation?: string | null
          area?: string | null
          occupation_types?: string[] | null
          activity_areas?: string[] | null
          branch_name?: string | null
          invoice_reg_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          bank_name?: string | null
          bank_branch?: string | null
          account_type?: string | null
          account_number?: string | null
          account_holder?: string | null
          postal_code?: string | null
          address?: string | null
          phone?: string | null
          invoice_note?: string | null
          occupation?: string | null
          area?: string | null
          occupation_types?: string[] | null
          activity_areas?: string[] | null
          branch_name?: string | null
          invoice_reg_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          email: string
          company_name: string | null
          full_name: string | null
          postal_code: string | null
          address: string | null
          phone: string | null
          organizer_code: string | null
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          company_name?: string | null
          full_name?: string | null
          postal_code?: string | null
          address?: string | null
          phone?: string | null
          organizer_code?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          company_name?: string | null
          full_name?: string | null
          postal_code?: string | null
          address?: string | null
          phone?: string | null
          organizer_code?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          user_type: 'talent' | 'organizer'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'trial' | 'active' | 'canceled' | 'expired'
          plan: string
          trial_end_date: string | null
          invoice_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: 'talent' | 'organizer'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'trial' | 'active' | 'canceled' | 'expired'
          plan?: string
          trial_end_date?: string | null
          invoice_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: 'talent' | 'organizer'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'trial' | 'active' | 'canceled' | 'expired'
          plan?: string
          trial_end_date?: string | null
          invoice_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      talent_usage: {
        Row: {
          id: string
          talent_id: string
          month: string
          invoice_sent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          talent_id: string
          month: string
          invoice_sent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          talent_id?: string
          month?: string
          invoice_sent?: number
          created_at?: string
          updated_at?: string
        }
      }
      organizer_usage: {
        Row: {
          id: string
          organizer_id: string
          month: string
          invoice_received: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          month: string
          invoice_received?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          month?: string
          invoice_received?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          talent_id: string
          invoice_number: string
          invoice_date: string
          payment_due_date: string
          recipient_company: string
          recipient_name: string | null
          recipient_postal_code: string | null
          recipient_address: string | null
          recipient_type: string | null
          subject: string | null
          work_date: string
          items: Json | null
          subtotal: number
          tax_amount: number
          withholding: number
          total_amount: number
          notes: string | null
          organizer_id: string | null
          status: string | null
          return_status: string | null
          return_comment: string | null
          return_date: string | null
          returned_by: string | null
          payment_status: 'paid' | 'unpaid' | null 
          created_at: string
          updated_at: string
          paid_date: string | null
        }
        Insert: {
          id?: string
          talent_id: string
          invoice_number: string
          invoice_date: string
          payment_due_date: string
          recipient_company: string
          recipient_name?: string | null
          recipient_postal_code?: string | null
          recipient_address?: string | null
          recipient_type?: string | null
          subject?: string | null
          work_date: string
          items?: Json | null
          subtotal?: number
          tax_amount?: number
          withholding?: number
          total_amount?: number
          notes?: string | null
          organizer_id?: string | null
          status?: string | null
          return_status?: string | null
          return_comment?: string | null
          return_date?: string | null
          returned_by?: string | null
          payment_status?: 'paid' | 'unpaid' | null
          created_at?: string
          updated_at?: string
          paid_date?: string | null
        }
        Update: {
          id?: string
          talent_id?: string
          invoice_number?: string
          invoice_date?: string
          payment_due_date?: string
          recipient_company?: string
          recipient_name?: string | null
          recipient_postal_code?: string | null
          recipient_address?: string | null
          recipient_type?: string | null
          subject?: string | null
          work_date?: string
          items?: Json | null
          subtotal?: number
          tax_amount?: number
          withholding?: number
          total_amount?: number
          notes?: string | null
          organizer_id?: string | null
          status?: string | null
          return_status?: string | null
          return_comment?: string | null
          return_date?: string | null
          returned_by?: string | null
          payment_status?: 'paid' | 'unpaid' | null
          created_at?: string
          updated_at?: string
          paid_date?: string | null
        }
      }
      organizer_invoices: {
        Row: {
          id: string
          organizer_id: string
          invoice_id: string | null
          talent_id: string | null
          invoice_number: string
          cast_name: string
          cast_email: string
          subject: string | null
          work_date: string | null
          payment_due_date: string | null
          subtotal: number
          tax: number
          withholding: number
          total: number
          items: Json
          bank_name: string | null
          branch_name: string | null
          account_type: string | null
          account_number: string | null
          account_holder: string | null
          invoice_reg_number: string | null
          status: 'pending' | 'approved' | 'paid' | 'returned'
          approved_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          invoice_id?: string | null
          talent_id?: string | null
          invoice_number: string
          cast_name: string
          cast_email: string
          subject?: string | null
          work_date?: string | null
          payment_due_date?: string | null
          subtotal: number
          tax: number
          withholding: number
          total: number
          items?: Json
          bank_name?: string | null
          branch_name?: string | null
          account_type?: string | null
          account_number?: string | null
          account_holder?: string | null
          invoice_reg_number?: string | null
          status?: 'pending' | 'approved' | 'paid' | 'returned'
          approved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          invoice_id?: string | null
          talent_id?: string | null
          invoice_number?: string
          cast_name?: string
          cast_email?: string
          subject?: string | null
          work_date?: string | null
          payment_due_date?: string | null
          recipient_name?: string | null
          recipient_address?: string | null
          recipient_postal_code?: string | null
          subtotal?: number
          tax?: number
          tax_amount?: number
          withholding?: number
          total?: number
          total_amount?: number
          notes?: string | null
          items?: Json
          bank_name?: string | null
          branch_name?: string | null
          account_type?: string | null
          account_number?: string | null
          account_holder?: string | null
          invoice_reg_number?: string | null
          status?: 'pending' | 'approved' | 'paid' | 'returned'
          approved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_posts: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          job_date: string | null
          location: string | null
          payment_amount: number | null
          status: 'draft' | 'published' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          description?: string | null
          job_date?: string | null
          location?: string | null
          payment_amount?: number | null
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          description?: string | null
          job_date?: string | null
          location?: string | null
          payment_amount?: number | null
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      banner_ads: {
        Row: {
          id: string
          organizer_id: string
          title: string
          image_url: string | null
          link_url: string | null
          start_date: string | null
          end_date: string | null
          status: 'draft' | 'active' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          image_url?: string | null
          link_url?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'active' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          title?: string
          image_url?: string | null
          link_url?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'active' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      actpit_codes: {
        Row: {
          id: string
          code: string
          organizer_id: string | null
          discount_rate: number
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          organizer_id?: string | null
          discount_rate?: number
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          organizer_id?: string | null
          discount_rate?: number
          used_at?: string | null
          created_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          talent_id: string | null
          organizer_id: string | null
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          talent_id?: string | null
          organizer_id?: string | null
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          talent_id?: string | null
          organizer_id?: string | null
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// エクスポート型（ダッシュボードで使用）
export type Organizer = Database['public']['Tables']['organizers']['Row']
export type OrganizerInvoice = Database['public']['Tables']['organizer_invoices']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
