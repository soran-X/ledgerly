'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Category } from '@/lib/types'

type EntryState = { error: string | null; success: boolean }

export async function addEntry(
  _prevState: EntryState,
  formData: FormData
): Promise<EntryState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const category = formData.get('category') as Category
  const variableAmount = formData.get('variable_amount') === 'true'
  const amountRaw = parseFloat(formData.get('amount') as string)
  const amount = variableAmount ? 0 : amountRaw
  const bankNameRaw = formData.get('bank_name') as string | null
  const customBankName = formData.get('custom_bank_name') as string | null
  const dueDayRaw = formData.get('due_day') as string | null
  const recurrenceRaw = formData.get('recurrence') as string | null
  const dueMonthRaw = formData.get('due_month') as string | null
  const dueMonthsRaw = formData.getAll('due_months[]') as string[]
  const dueDateRaw = formData.get('due_date') as string | null

  if (!name || (!variableAmount && (isNaN(amountRaw) || amountRaw <= 0))) {
    return { error: 'Please provide a valid name and amount.', success: false }
  }

  const bank_name =
    category === 'saving' || category === 'expense'
      ? bankNameRaw === 'Others'
        ? (customBankName?.trim() || null)
        : (bankNameRaw || null)
      : null

  const recurrence =
    category === 'bill' ? (recurrenceRaw || 'monthly') :
    category === 'expense' ? (recurrenceRaw || 'once') :
    null

  const due_day =
    (category === 'bill' || category === 'expense') && recurrence !== 'once' && dueDayRaw
      ? parseInt(dueDayRaw, 10) || null
      : null

  const due_month =
    (category === 'bill' || category === 'expense') && recurrence === 'yearly' && dueMonthRaw
      ? parseInt(dueMonthRaw, 10) || null
      : null

  const due_months =
    category === 'bill' && recurrence === 'quarterly' && dueMonthsRaw.length > 0
      ? dueMonthsRaw.map((m) => parseInt(m, 10)).filter(Boolean)
      : null

  const due_date =
    (category === 'bill' || category === 'expense') && recurrence === 'once' && dueDateRaw
      ? dueDateRaw
      : null

  const { error } = await supabase.from('entries').insert({
    user_id: user.id,
    name,
    amount,
    category,
    bank_name,
    due_day,
    recurrence,
    due_month,
    due_months,
    due_date,
    variable_amount: category === 'bill' ? variableAmount : false,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard')
  return { error: null, success: true }
}

export async function payBill(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const id = formData.get('id') as string
  const payAmountRaw = formData.get('pay_amount') as string | null
  const nowPH = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const today = `${nowPH.getUTCFullYear()}-${String(nowPH.getUTCMonth() + 1).padStart(2, '0')}-${String(nowPH.getUTCDate()).padStart(2, '0')}`
  const updates: Record<string, unknown> = { last_paid_date: today }
  if (payAmountRaw) {
    const payAmount = parseFloat(payAmountRaw)
    if (!isNaN(payAmount) && payAmount > 0) updates.amount = payAmount
  }
  await supabase.from('entries').update(updates).eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function deleteEntry(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('entries').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
