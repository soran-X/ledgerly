'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { AssetType } from '@/lib/types'

type AllocateState = { error: string | null; success: boolean }

export async function allocateBudget(
  _prevState: AllocateState,
  formData: FormData
): Promise<AllocateState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('asset_id') as string
  const amountRaw = parseFloat(formData.get('amount') as string)

  if (!id || isNaN(amountRaw) || amountRaw <= 0) {
    return { error: 'Please select an asset and enter a valid amount.', success: false }
  }

  const { data: asset } = await supabase
    .from('assets')
    .select('value')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!asset) return { error: 'Asset not found.', success: false }

  const { error } = await supabase
    .from('assets')
    .update({ value: asset.value + amountRaw, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard')
  return { error: null, success: true }
}

export async function addAsset(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as AssetType
  const value = parseFloat(formData.get('value') as string)
  const conjugal = formData.get('conjugal') === 'true'
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (!name || isNaN(value)) return

  await supabase.from('assets').insert({ user_id: user.id, name, type, value, conjugal, notes })
  revalidatePath('/dashboard')
}

export async function updateAsset(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as AssetType
  const value = parseFloat(formData.get('value') as string)
  const conjugal = formData.get('conjugal') === 'true'
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (!name || isNaN(value)) return

  await supabase.from('assets')
    .update({ name, type, value, conjugal, notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function deleteAsset(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('assets').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}
