import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProfile, leaveFamily, removeFamilyMember } from './actions'
import { JoinFamilyForm } from '@/components/JoinFamilyForm'
import { ThemePickerForm } from '@/components/ThemePickerForm'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure profile exists
  await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

  const { data: profile } = await supabase
    .from('profiles').select('id, first_name, last_name, invite_code, family_theme').eq('id', user.id).single()

  // Am I a member of someone else's family?
  const { data: myMembership } = await supabase
    .from('family_members').select('owner_id').eq('member_id', user.id).maybeSingle()

  // My family members (if I'm the owner) — plain IDs only, no join
  const { data: rawMembers } = await supabase
    .from('family_members').select('member_id').eq('owner_id', user.id)

  // Fetch profiles for all relevant user IDs in one query
  const relevantIds = [
    ...(rawMembers?.map(m => m.member_id) ?? []),
    ...(myMembership ? [myMembership.owner_id] : []),
  ]
  const profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {}
  if (relevantIds.length > 0) {
    const { data: relProfiles } = await supabase
      .from('profiles').select('id, first_name, last_name').in('id', relevantIds)
    relProfiles?.forEach(p => { profileMap[p.id] = p })
  }

  const isMember = !!myMembership
  const myMembers = rawMembers ?? []

  function displayName(id: string, fallback = 'Unnamed member') {
    const p = profileMap[id]
    if (!p?.first_name) return fallback
    return `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold">Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" name="first_name" defaultValue={profile?.first_name ?? ''} placeholder="James" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" name="last_name" defaultValue={profile?.last_name ?? ''} placeholder="Dela Cruz" />
                </div>
              </div>
              <Button type="submit" size="sm">Save</Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite code — hidden for non-admin members */}
        {!isMember && (
          <Card>
            <CardHeader><CardTitle className="text-base">Your Invite Code</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Share this code with family members so they can join your ledger.
              </p>
              <code className="rounded-md bg-muted px-4 py-2 text-lg font-mono font-bold tracking-widest inline-block">
                {profile?.invite_code ?? '—'}
              </code>
            </CardContent>
          </Card>
        )}

        {/* Family Theme — admin/owner only */}
        {!isMember && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Family Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Choose an accent color for your family&apos;s dashboard.
              </p>
              <ThemePickerForm currentTheme={profile?.family_theme ?? 'default'} />
            </CardContent>
          </Card>
        )}

        {/* If I'm a member of someone else's family */}
        {isMember && (
          <Card>
            <CardHeader><CardTitle className="text-base">Family</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are a member of{' '}
                <span className="font-medium text-foreground">
                  {displayName(myMembership!.owner_id, 'your family head')}
                </span>
                &apos;s family.
              </p>
              <form action={leaveFamily}>
                <Button type="submit" variant="outline" size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10">
                  Leave family
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* If I'm not a member — show Join form + my own members */}
        {!isMember && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Join a Family</CardTitle></CardHeader>
              <CardContent>
                <JoinFamilyForm />
              </CardContent>
            </Card>

            {myMembers.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Family Members</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myMembers.map((m) => {
                    const removeWithId = removeFamilyMember.bind(null, m.member_id)
                    return (
                      <div key={m.member_id} className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium">
                          {displayName(m.member_id)}
                        </span>
                        <form action={removeWithId}>
                          <Button type="submit" variant="ghost" size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            Remove
                          </Button>
                        </form>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
