import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://atbkhcbfwmsolzunosuw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YmtoY2Jmd21zb2x6dW5vc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTA2MDUsImV4cCI6MjA4ODM4NjYwNX0.784OhW4SHqK-Ljk5KuorlPtRQgj2sgAffh1eyoezvqY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  preferred_language: string
  preferred_currency: string
  referral_code: string | null
  referred_by: string | null
  is_blacklisted: boolean
  created_at: string
  updated_at: string
  agreed_to_terms: boolean
  agreed_to_terms_at: string | null
  terms_version: string
  privacy_policy_version: string
  role: string
  is_active: boolean
}

export type Product = {
  id: number | string
  sku: string
  name: string
  name_vi: string | null
  description: string | null
  description_vi: string | null
  category_id: number | string | null
  weight: number
  purity: string
  labor_cost_twd: number
  labor_cost_vnd: number
  labor_fee?: number  // alias for labor_cost_twd
  size_options: string[]
  images: string[]
  stock_quantity: number
  stock?: number  // alias for stock_quantity
  is_active: boolean
  image_url?: string | null
  // 新增欄位
  has_certificate: boolean
  video_url?: string | null
  markup_amount: number
}

export type GoldPrice = {
  id: number
  price_twd: number
  price_vnd: number
  recorded_at: string
}

export type Store = {
  id: string  // Changed from number to string (UUID from profiles)
  store_name: string
  store_name_vi?: string | null
  store_address: string
  store_address_vi?: string | null
  store_phone: string
  store_business_hours?: string | null
  full_name: string
  phone?: string | null
  is_store_visible?: boolean
  latitude?: number | null
  longitude?: number | null
}


export type Order = {
  id: string
  user_id: string
  order_number: string
  verification_code?: string
  status: string
  currency: string
  subtotal: number
  discount: number
  total: number
  gold_price_at_order: number | null
  pickup_date: string | null
  pickup_time_slot: string | null
  store_id: number | null
  payment_method?: string
  receipt_number?: string
  verified_at?: string
  paid_at?: string
  completed_at?: string
  created_at: string
}

export type CartItem = {
  product: Product
  quantity: number
  selectedSize?: string
}

export type Notification = {
  id: number
  user_id: string
  type: NotificationType
  title: string
  title_vi?: string | null
  content?: string | null
  content_vi?: string | null
  is_read: boolean
  created_at: string
  updated_at: string
  metadata?: {
    order_id?: string
    action_url?: string
    [key: string]: any
  } | null
  recipient_role?: 'admin' | 'agent' | 'user' | 'global' | null
}

export type NotificationType =
  | 'registration'
  | 'order'
  | 'completion'
  | 'settlement'
  | 'commission'
  | 'shipping'
  | 'agent_signup'
  | 'withdrawal'
  | 'system'
