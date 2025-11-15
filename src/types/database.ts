// src/types/database.ts
// 完全再構築版 - データベーススキーマと完全一致（追加カラム対応）

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
          talent_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'trial' | 'active' | 'canceled' | 'expired'
          plan_type: string
          trial_start: string
          trial_end: string | null
          subscription_start: string | null
          subscription_end: string | null
          invoice_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          talent_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'trial' | 'active' | 'canceled' | 'expired'
          plan_type?: string
          trial_start?: string
          trial_end?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          invoice_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          talent_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'trial' | 'active' | 'canceled' | 'expired'
          plan_type?: string
          trial_start?: string
          trial_end?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
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
          items: Json
          subtotal: number
          tax_amount: number
          total_amount: number
          notes: string | null
          status: 'pending' | 'sent' | 'paid' | 'canceled'
          created_at: string
          updated_at: string
          organizer_id: string | null
          return_status: 'none' | 'returned' | 'resolved' | null
          payment_status: 'unpaid' | 'paid' | null
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
          items?: Json
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          status?: 'pending' | 'sent' | 'paid' | 'canceled'
          created_at?: string
          updated_at?: string
          organizer_id: string | null
          return_status: 'none' | 'returned' | 'resolved' | null
          payment_status: 'unpaid' | 'paid' | null
          paid_date: string | null
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
          items?: Json
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          status?: 'pending' | 'sent' | 'paid' | 'canceled'
          created_at?: string
          updated_at?: string
          organizer_id: string | null
          return_status: 'none' | 'returned' | 'resolved' | null
          payment_status: 'unpaid' | 'paid' | null
          paid_date: string | null
        }
      }
      organizer_invoices: {
        Row: {
          id: string
          organizer_id: string
          invoice_id: string
          status: 'received' | 'approved' | 'paid' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          invoice_id: string
          status?: 'received' | 'approved' | 'paid' | 'rejected'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          invoice_id?: string
          status?: 'received' | 'approved' | 'paid' | 'rejected'
          notes?: string | null
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