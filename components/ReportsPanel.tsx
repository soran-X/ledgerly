'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Entry, Asset } from '@/lib/types'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function getDueDatesInRange(entry: Entry, start: Date, end: Date): Date[] {
  const rec = entry.recurrence ?? 'monthly'
  const dates: Date[] = []

  if (rec === 'once') {
    if (!entry.due_date) return []
    const d = new Date(entry.due_date + 'T00:00:00')
    if (d >= start && d <= end) dates.push(d)
    return dates
  }

  if (rec === 'monthly') {
    if (entry.due_day == null) return []
    let y = start.getFullYear()
    let m = start.getMonth()
    while (true) {
      const d = new Date(y, m, entry.due_day)
      if (d > end) break
      if (d >= start) dates.push(d)
      m++
      if (m > 11) { m = 0; y++ }
    }
    return dates
  }

  if (rec === 'quarterly') {
    if (entry.due_day == null || !entry.due_months?.length) return []
    const startY = start.getFullYear()
    const endY = end.getFullYear()
    for (let y = startY - 1; y <= endY + 1; y++) {
      for (const qm of [...entry.due_months].sort((a, b) => a - b)) {
        const d = new Date(y, qm - 1, entry.due_day)
        if (d < start || d > end) continue
        dates.push(d)
      }
    }
    return dates.sort((a, b) => a.getTime() - b.getTime())
  }

  if (rec === 'yearly') {
    if (entry.due_day == null || entry.due_month == null) return []
    for (let y = start.getFullYear(); y <= end.getFullYear() + 1; y++) {
      const d = new Date(y, entry.due_month - 1, entry.due_day)
      if (d > end) break
      if (d >= start) dates.push(d)
    }
    return dates
  }

  return dates
}

// ── Report A: Bill Cost Analyzer ─────────────────────────────────────────────

function BillCostAnalyzer({ entries }: { entries: Entry[] }) {
  const bills = entries.filter(e => e.category === 'bill')
  const income = entries.filter(e => e.category === 'income').reduce((s, e) => s + e.amount, 0)

  type BillRow = {
    id: string
    name: string
    recurrence: string
    amount: number
    monthlyEq: number | null
    annualCost: number | null
    oneTime: boolean
  }

  const rows: BillRow[] = bills.map(b => {
    const rec = b.recurrence ?? 'monthly'
    if (rec === 'monthly') {
      return { id: b.id, name: b.name, recurrence: 'Monthly', amount: b.amount, monthlyEq: b.amount, annualCost: b.amount * 12, oneTime: false }
    }
    if (rec === 'quarterly') {
      return { id: b.id, name: b.name, recurrence: 'Quarterly', amount: b.amount, monthlyEq: b.amount / 3, annualCost: b.amount * 4, oneTime: false }
    }
    if (rec === 'yearly') {
      return { id: b.id, name: b.name, recurrence: 'Yearly', amount: b.amount, monthlyEq: b.amount / 12, annualCost: b.amount, oneTime: false }
    }
    return { id: b.id, name: b.name, recurrence: 'One-time', amount: b.amount, monthlyEq: null, annualCost: null, oneTime: true }
  })

  const totalMonthly = rows.reduce((s, r) => s + (r.monthlyEq ?? 0), 0)
  const totalAnnual = rows.reduce((s, r) => s + (r.annualCost ?? 0), 0)
  const billsPct = income > 0 ? (totalMonthly / income * 100).toFixed(1) : null

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Bill Cost Analyzer</h3>
      {bills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills found.</p>
      ) : (
        <>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bill</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Frequency</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monthly Eq.</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Annual Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map(r => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{r.recurrence}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(r.amount)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {r.oneTime ? <span className="italic text-xs">One-time</span> : fmt(r.monthlyEq!)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {r.oneTime ? <span className="italic text-xs">—</span> : fmt(r.annualCost!)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-4 py-3" colSpan={3}>Total</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(totalMonthly)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(totalAnnual)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
          {billsPct !== null && (
            <p className="mt-3 text-sm text-muted-foreground">
              Bills represent <span className="font-semibold text-foreground">{billsPct}%</span> of total income.
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ── Report B: Upcoming Bills (Next 90 Days) ───────────────────────────────────

function UpcomingBills({ entries }: { entries: Entry[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today.getTime() + 90 * 86400000)

  const bills = entries.filter(e => e.category === 'bill')

  type UpcomingItem = {
    key: string
    name: string
    amount: number
    date: Date
    isPaid: boolean
  }

  const upcoming: UpcomingItem[] = []

  for (const bill of bills) {
    const dates = getDueDatesInRange(bill, today, end)
    const nextDue = getNextDueDate(bill, today)
    const currentCyclePaid = isPaidCurrentCycle(bill, today)

    for (const date of dates) {
      const isPaid = nextDue !== null && date.getTime() === nextDue.getTime()
        ? currentCyclePaid
        : false
      upcoming.push({
        key: `${bill.id}-${date.toISOString()}`,
        name: bill.name,
        amount: bill.amount,
        date,
        isPaid,
      })
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())

  type Group = { label: string; items: UpcomingItem[] }
  const groups: Group[] = []
  for (const item of upcoming) {
    const label = `${MONTH_NAMES[item.date.getMonth()]} ${item.date.getFullYear()}`
    const existing = groups.find(g => g.label === label)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Upcoming Bills — Next 90 Days</h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming bills in the next 90 days.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y">
                        {group.items.map(item => (
                          <tr
                            key={item.key}
                            className={`hover:bg-muted/30 transition-colors ${item.isPaid ? 'opacity-60' : ''}`}
                          >
                            <td className="px-4 py-3 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground text-right">
                              {MONTH_NAMES[item.date.getMonth()]} {item.date.getDate()}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-right">{fmt(item.amount)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-xs font-semibold ${
                                item.isPaid
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {item.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Report C: Net Worth ───────────────────────────────────────────────────────

function NetWorthReport({ assets, entries }: { assets: Asset[]; entries: Entry[] }) {
  const totalAssets = assets.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
  const totalInvestments = assets.filter(a => a.type === 'investment').reduce((s, a) => s + a.value, 0)
  const totalLiabilities = assets
    .filter(a => a.type === 'liability' || a.type === 'mortgage')
    .reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets + totalInvestments - totalLiabilities

  const income = entries.filter(e => e.category === 'income').reduce((s, e) => s + e.amount, 0)
  const bills = entries.filter(e => e.category === 'bill').reduce((s, e) => s + e.amount, 0)
  const expenses = entries.filter(e => e.category === 'expense').reduce((s, e) => s + e.amount, 0)
  const savings = entries.filter(e => e.category === 'saving').reduce((s, e) => s + e.amount, 0)
  const leftover = income - bills - expenses - savings

  const pctOf = (val: number) =>
    netWorth > 0 ? ((val / netWorth) * 100).toFixed(1) + '%' : '—'

  const sectionTable = (items: Asset[], label: string, colorClass: string) => (
    <div className="mb-6">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None recorded.</p>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Value</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">% of Net Worth</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(a => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium">{a.name}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-medium ${colorClass}`}>{fmt(a.value)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">{pctOf(a.value)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{a.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4">Net Worth Report</h3>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assets</p>
          <p className="mt-1 text-base font-bold text-green-600 dark:text-green-400 tabular-nums">{fmt(totalAssets)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Investments</p>
          <p className="mt-1 text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{fmt(totalInvestments)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Liabilities</p>
          <p className="mt-1 text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{fmt(totalLiabilities)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Worth</p>
          <p className={`mt-1 text-base font-bold tabular-nums ${netWorth >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-destructive'}`}>
            {fmt(netWorth)}
          </p>
        </div>
      </div>

      {/* Breakdown tables */}
      {sectionTable(
        assets.filter(a => a.type === 'asset'),
        'Assets',
        'text-green-600 dark:text-green-400'
      )}
      {sectionTable(
        assets.filter(a => a.type === 'investment'),
        'Investments',
        'text-indigo-600 dark:text-indigo-400'
      )}
      {sectionTable(
        assets.filter(a => a.type === 'liability' || a.type === 'mortgage'),
        'Liabilities & Mortgages',
        'text-red-600 dark:text-red-400'
      )}

      {/* Monthly Cash Flow */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Monthly Cash Flow</h4>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {[
                  { label: 'Income', value: income, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Bills', value: -bills, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Expenses', value: -expenses, color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Savings', value: -savings, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Leftover', value: leftover, color: leftover >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-destructive' },
                ].map(({ label, value, color }) => (
                  <tr key={label} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">{label}</td>
                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${color}`}>
                      {value < 0 ? `−${fmt(Math.abs(value))}` : fmt(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ReportsPanel({ entries, assets }: { entries: Entry[]; assets: Asset[] }) {
  const [report, setReport] = useState<'analyzer' | 'upcoming' | 'networth'>('analyzer')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'analyzer', label: 'Bill Cost Analyzer' },
          { key: 'upcoming', label: 'Upcoming Bills (90 days)' },
          { key: 'networth', label: 'Net Worth' },
        ] as { key: typeof report; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setReport(key)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              report === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {report === 'analyzer' && <BillCostAnalyzer entries={entries} />}
      {report === 'upcoming' && <UpcomingBills entries={entries} />}
      {report === 'networth' && <NetWorthReport entries={entries} assets={assets} />}
    </div>
  )
}
