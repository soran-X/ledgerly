import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardTabs } from '@/components/DashboardTabs'
import { InsightsCard } from '@/components/InsightsCard'
import { themeStyleTag } from '@/lib/themes'
import type { Entry, Asset, Message } from '@/lib/types'
import type { MonthBill } from '@/components/DashboardTabs'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Compact format for summary cards — abbreviates to fit narrow 6-column cards
function fmtCard(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000)
    return sign + '₱' + (abs / 1_000_000_000).toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + 'B'
  if (abs >= 1_000_000)
    return sign + '₱' + (abs / 1_000_000).toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + 'M'
  if (abs >= 100_000)
    return sign + '₱' + (abs / 1_000).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'K'
  return sign + '₱' + abs.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getThisMonthDueDate(entry: Entry, curYear: number, curMonth: number): Date | null {
  const rec = entry.recurrence ?? 'monthly'
  if (rec === 'once') {
    if (!entry.due_date) return null
    const d = new Date(entry.due_date + 'T00:00:00')
    if (d.getFullYear() === curYear && d.getMonth() === curMonth) return d
    return null
  }
  if (rec === 'monthly') {
    if (entry.due_day == null) return null
    return new Date(curYear, curMonth, entry.due_day)
  }
  if (rec === 'quarterly') {
    if (entry.due_day == null || !entry.due_months?.includes(curMonth + 1)) return null
    return new Date(curYear, curMonth, entry.due_day)
  }
  if (rec === 'yearly') {
    if (entry.due_day == null || entry.due_month !== curMonth + 1) return null
    return new Date(curYear, curMonth, entry.due_day)
  }
  return null
}

function getNextDueDate(entry: Entry, today: Date): Date | null {
  const rec = entry.recurrence ?? 'monthly'
  const y = today.getFullYear()
  const m = today.getMonth()

  if (rec === 'once') {
    if (!entry.due_date) return null
    return new Date(entry.due_date + 'T00:00:00')
  }
  if (rec === 'monthly') {
    if (entry.due_day == null) return null
    const thisMonth = new Date(y, m, entry.due_day)
    if (thisMonth >= today) return thisMonth
    return new Date(y, m + 1, entry.due_day)
  }
  if (rec === 'quarterly') {
    if (entry.due_day == null || !entry.due_months?.length) return null
    const sorted = [...entry.due_months].sort((a, b) => a - b)
    for (const qm of sorted) {
      const d = new Date(y, qm - 1, entry.due_day)
      if (d >= today) return d
    }
    return new Date(y + 1, sorted[0] - 1, entry.due_day)
  }
  if (rec === 'yearly') {
    if (entry.due_day == null || entry.due_month == null) return null
    const thisYear = new Date(y, entry.due_month - 1, entry.due_day)
    if (thisYear >= today) return thisYear
    return new Date(y + 1, entry.due_month - 1, entry.due_day)
  }
  return null
}

function isPaidCurrentCycle(entry: Entry, today: Date): boolean {
  if (!entry.last_paid_date) return false
  if (entry.recurrence === 'once') return true
  const paidDate = new Date(entry.last_paid_date + 'T00:00:00')
  const nextAfterPayment = getNextDueDate(entry, new Date(paidDate.getTime() + 86400000))
  if (!nextAfterPayment) return true
  return nextAfterPayment > today
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure profile exists, fetch it
  await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
  const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : user.email

  // Family context
  const [{ data: myMembership }, { data: myFamilyMembers }] = await Promise.all([
    supabase.from('family_members').select('owner_id').eq('member_id', user.id).maybeSingle(),
    supabase.from('family_members').select('member_id').eq('owner_id', user.id),
  ])

  const familyOwnerId: string = myMembership?.owner_id ?? user.id
  const hasFamilyMembers = (myFamilyMembers?.length ?? 0) > 0 || !!myMembership

  // All user IDs in the family for profile name lookup
  const allFamilyIds = Array.from(new Set([
    user.id,
    ...(myFamilyMembers?.map(m => m.member_id) ?? []),
    ...(myMembership ? [myMembership.owner_id] : []),
  ]))

  // Load entries, assets, profiles, messages, and owner theme in parallel
  // Try fetching profiles with email column; fall back silently if it doesn't exist yet
  const [{ data }, { data: assetsData }, profileResult, { data: msgData }, { data: themeData }] = await Promise.all([
    supabase.from('entries').select('*').order('created_at', { ascending: false }),
    supabase.from('assets').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, first_name, last_name, email').in('id', allFamilyIds),
    hasFamilyMembers
      ? supabase.from('messages').select('*').eq('family_owner_id', familyOwnerId).order('created_at', { ascending: true }).limit(100)
      : Promise.resolve({ data: [] }),
    supabase.from('profiles').select('family_theme').eq('id', familyOwnerId).single(),
  ])
  const ownerTheme = (themeData as { family_theme?: string } | null)?.family_theme ?? 'indigo'
  // If email column doesn't exist, refetch without it
  const familyProfilesData = profileResult.error
    ? (await supabase.from('profiles').select('id, first_name, last_name').in('id', allFamilyIds)).data
    : profileResult.data

  const entries: Entry[] = data ?? []
  const assets: Asset[] = assetsData ?? []
  const initialMessages: Message[] = (msgData ?? []) as Message[]

  // Build name maps — prefer name, fall back to email, then generic label
  const ownerNames: Record<string, string> = {}
  const userNames: Record<string, string> = {}
  ;(familyProfilesData ?? []).forEach((p: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null }) => {
    const name = p.first_name
      ? `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
      : p.id === user.id
        ? (user.email ?? 'Me')
        : (p.email ?? 'Family Member')
    ownerNames[p.id] = name
    userNames[p.id] = name
  })
  // Ensure current user is in the map
  if (!userNames[user.id]) {
    userNames[user.id] = displayName ?? user.email ?? 'Me'
    ownerNames[user.id] = userNames[user.id]
  }

  const income = entries.filter((e) => e.category === 'income').reduce((s, e) => s + e.amount, 0)
  const bills  = entries.filter((e) => e.category === 'bill').reduce((s, e) => s + e.amount, 0)
  const savings = entries.filter((e) => e.category === 'saving').reduce((s, e) => s + e.amount, 0)
  const expenses = entries.filter((e) => e.category === 'expense').reduce((s, e) => s + e.amount, 0)
  const leftover = income - bills - savings - expenses

  const totalAssets = assets.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
  const totalInvestments = assets.filter(a => a.type === 'investment').reduce((s, a) => s + a.value, 0)
  const totalLiabilities = assets.filter(a => a.type === 'liability' || a.type === 'mortgage').reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets + totalInvestments - totalLiabilities

  const summaryCards = [
    { label: 'Total Income',    value: fmtCard(income),   full: fmt(income),   color: 'text-green-600 dark:text-green-400',    border: 'border-t-green-500'    },
    { label: 'Total Bills',     value: fmtCard(bills),    full: fmt(bills),    color: 'text-red-600 dark:text-red-400',        border: 'border-t-red-500'      },
    { label: 'Total Savings',   value: fmtCard(savings),  full: fmt(savings),  color: 'text-blue-600 dark:text-blue-400',      border: 'border-t-blue-500'     },
    { label: 'Total Expenses',  value: fmtCard(expenses), full: fmt(expenses), color: 'text-purple-600 dark:text-purple-400',  border: 'border-t-purple-500'   },
    {
      label: 'Leftover Balance',
      value: fmtCard(leftover), full: fmt(leftover),
      color: leftover >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-destructive',
      border: leftover >= 0 ? 'border-t-violet-500' : 'border-t-destructive',
    },
    {
      label: 'Net Worth',
      value: fmtCard(netWorth), full: fmt(netWorth),
      color: netWorth >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-destructive',
      border: netWorth >= 0 ? 'border-t-violet-500' : 'border-t-destructive',
    },
  ]

  // Philippine time (UTC+8)
  const nowPH   = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const phHour  = nowPH.getUTCHours()
  const timeGreeting = phHour < 12 ? 'Good morning' : phHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.first_name ?? user.email?.split('@')[0] ?? 'there'
  const curYear  = nowPH.getUTCFullYear()
  const curMonth = nowPH.getUTCMonth() // 0-based
  const todayPH  = new Date(Date.UTC(curYear, curMonth, nowPH.getUTCDate()))
  const monthLabel = `${MONTH_NAMES[curMonth]} ${curYear}`

  // All bills due this month, paid ones at the bottom
  const monthBills: MonthBill[] = entries
    .filter((e) => e.category === 'bill')
    .flatMap((e) => {
      const due = getThisMonthDueDate(e, curYear, curMonth)
      if (!due) return []
      const daysLeft = Math.ceil((due.getTime() - todayPH.getTime()) / 86400000)
      const isPaid = isPaidCurrentCycle(e, todayPH)
      const paidDateLabel = e.last_paid_date
        ? (() => {
            const d = new Date(e.last_paid_date + 'T00:00:00')
            return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
          })()
        : null
      return [{
        id: e.id,
        name: e.name,
        amount: e.amount,
        daysLeft,
        nextDueLabel: `${MONTH_NAMES[due.getMonth()]} ${due.getDate()}`,
        isPaid,
        paidDateLabel,
        variableAmount: e.variable_amount ?? false,
      }]
    })
    .sort((a, b) => {
      // unpaid first (sorted by daysLeft), paid last
      if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
      return a.daysLeft - b.daysLeft
    })

  const themeStyle = themeStyleTag(ownerTheme)

  return (
    <>
    {themeStyle && <style>{themeStyle}</style>}
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">Ledgerly</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{displayName}</span>
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {timeGreeting}, {firstName}! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your financial snapshot.</p>
        </div>

        {/* Summary Cards */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {summaryCards.map((card) => (
              <Card key={card.label} className={`border-t-4 ${card.border} shadow-sm`}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <p
                    title={card.full}
                    className={`text-lg font-bold tabular-nums leading-tight ${card.color}`}
                  >
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Insights */}
        <InsightsCard />

        {/* Tabs */}
        <DashboardTabs
          monthBills={monthBills}
          entries={entries}
          monthLabel={monthLabel}
          assets={assets}
          userId={user.id}
          ownerNames={ownerNames}
          hasFamilyMembers={hasFamilyMembers}
          familyOwnerId={familyOwnerId}
          initialMessages={initialMessages}
          userNames={userNames}
          leftover={leftover}
        />
      </main>
    </div>
    </>
  )
}
