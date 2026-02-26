'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const PH_BANKS = [
  'BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB',
  'Security Bank', 'RCBC', 'EastWest', 'Chinabank', 'PSBank',
  'Maya', 'GCash', 'SeaBank', 'GoTyme',
]

export async function setupSavings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inserts: {
    user_id: string
    category: string
    name: string
    amount: number
    bank_name: string
  }[] = []

  for (const bank of PH_BANKS) {
    const raw = formData.get(`bank_${bank}`) as string | null
    const amount = parseFloat(raw ?? '')
    if (!isNaN(amount) && amount > 0) {
      inserts.push({
        user_id: user.id,
        category: 'saving',
        name: `${bank} Savings`,
        amount,
        bank_name: bank,
      })
    }
  }

  // Others
  const othersAmount = parseFloat(formData.get('bank_others_amount') as string ?? '')
  const othersName = (formData.get('bank_others_name') as string ?? '').trim()
  if (!isNaN(othersAmount) && othersAmount > 0) {
    inserts.push({
      user_id: user.id,
      category: 'saving',
      name: othersName ? `${othersName} Savings` : 'Other Savings',
      amount: othersAmount,
      bank_name: othersName || 'Others',
    })
  }

  if (inserts.length > 0) {
    await supabase.from('entries').insert(inserts)
  }

  revalidatePath('/')
  redirect('/')
}
