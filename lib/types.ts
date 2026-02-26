export type Category = 'income' | 'bill' | 'saving' | 'expense'

export type AssetType = 'asset' | 'liability' | 'mortgage' | 'investment'

export interface Asset {
  id: string
  user_id: string
  name: string
  type: AssetType
  value: number
  conjugal: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  family_owner_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  invite_code: string
  created_at: string
}

export interface Entry {
  id: string
  user_id: string
  category: Category
  name: string
  amount: number
  created_at: string
  bank_name?: string | null
  due_day?: number | null
  recurrence?: 'monthly' | 'quarterly' | 'yearly' | 'once' | null
  due_month?: number | null
  due_months?: number[] | null
  due_date?: string | null
  last_paid_date?: string | null
  variable_amount?: boolean | null
}
