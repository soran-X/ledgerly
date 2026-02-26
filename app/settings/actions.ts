'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const first_name = (formData.get('first_name') as string).trim() || null
  const last_name = (formData.get('last_name') as string).trim() || null

  await supabase.from('profiles').upsert({ id: user.id, first_name, last_name })
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

type JoinState = { error: string | null }

export async function joinFamily(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = (formData.get('invite_code') as string).trim().toUpperCase()
  if (!code) return { error: 'Enter a valid invite code.' }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('invite_code', code)
    .single()

  if (!ownerProfile) return { error: 'Invite code not found.' }
  if (ownerProfile.id === user.id) return { error: "You can't join your own family." }

  await supabase.from('profiles').upsert({ id: user.id })

  const { error } = await supabase
    .from('family_members')
    .insert({ owner_id: ownerProfile.id, member_id: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'You are already in a family.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { error: null }
}

export async function leaveFamily() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('family_members').delete().eq('member_id', user.id)
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export async function updateFamilyTheme(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const theme = formData.get('theme') as string
  const valid = ['default', 'indigo', 'rose', 'emerald', 'sky', 'amber']
  if (!valid.includes(theme)) return

  await supabase.from('profiles').upsert({ id: user.id, family_theme: theme })
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export async function removeFamilyMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('family_members')
    .delete()
    .eq('owner_id', user.id)
    .eq('member_id', memberId)

  revalidatePath('/dashboard')
  revalidatePath('/settings')
}
