'use client'

import { useState, useCallback, useEffect } from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EntryForm } from '@/components/EntryForm'
import { EntryList } from '@/components/EntryList'
import { AssetsPanel } from '@/components/AssetsPanel'
import { ReportsPanel } from '@/components/ReportsPanel'
import { FamilyChat } from '@/components/FamilyChat'
import { payBill } from '@/app/actions'
import { allocateBudget } from '@/app/assets/actions'
import type { Entry, Asset, Message } from '@/lib/types'

function AllocateBudgetModal({
  assets,
  leftover,
  onClose,
}: {
  assets: Asset[]
  leftover: number
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState(allocateBudget, { error: null, success: false })

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  const bankAssets = assets.filter(a => a.type === 'asset')
  const investments = assets.filter(a => a.type === 'investment')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-1">Allocate Budget</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Available leftover: <span className="font-semibold text-violet-600 dark:text-violet-400">{fmt(leftover)}</span>
        </p>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="modal-asset">Destination</Label>
            <select
              id="modal-asset"
              name="asset_id"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {bankAssets.length > 0 && (
                <optgroup label="Bank / Savings">
                  {bankAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
              {investments.length > 0 && (
                <optgroup label="Investments">
                  {investments.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modal-amount">Amount (₱)</Label>
            <Input
              id="modal-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={leftover}
              placeholder="0.00"
              required
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Allocating…' : 'Allocate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export type MonthBill = {
  id: string
  name: string
  amount: number
  daysLeft: number
  nextDueLabel: string
  isPaid: boolean
  paidDateLabel: string | null
  variableAmount: boolean
}

type Tab = 'bills' | 'networth' | 'entries' | 'reports' | 'chat'


function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function DashboardTabs({
  monthBills,
  entries,
  monthLabel,
  assets,
  userId,
  ownerNames,
  hasFamilyMembers,
  familyOwnerId,
  initialMessages,
  userNames,
  leftover,
}: {
  monthBills: MonthBill[]
  entries: Entry[]
  monthLabel: string
  assets: Asset[]
  userId: string
  ownerNames: Record<string, string>
  hasFamilyMembers: boolean
  familyOwnerId: string
  initialMessages: Message[]
  userNames: Record<string, string>
  leftover: number
}) {
  const [tab, setTab] = useState<Tab>('bills')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAllocate, setShowAllocate] = useState(false)
  const allocatableAssets = assets.filter(a => a.type === 'asset' || a.type === 'investment')
  const paidCount = monthBills.filter((b) => b.isPaid).length

  const handleNewMessage = useCallback((senderName: string, content: string) => {
    setUnreadCount(c => c + 1)
    toast.message(`💬 ${senderName}`, {
      description: content.length > 80 ? content.slice(0, 80) + '…' : content,
      action: { label: 'View', onClick: () => { setTab('chat'); setUnreadCount(0) } },
    })
  }, [])

  function goToChat() {
    setTab('chat')
    setUnreadCount(0)
  }

  type TabDef = { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }
  const tabs: TabDef[] = [
    {
      key: 'bills', label: `Bills · ${monthLabel}`, shortLabel: 'Bills',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      key: 'networth', label: 'Net Worth', shortLabel: 'Worth',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      key: 'entries', label: 'All Entries', shortLabel: 'Entries',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      key: 'reports', label: 'Reports', shortLabel: 'Reports',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    },
    ...(hasFamilyMembers ? [{
      key: 'chat' as Tab, label: 'Family Chat', shortLabel: 'Chat',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    }] : []),
  ]

  function switchTab(key: Tab) {
    setTab(key)
    if (key === 'chat') setUnreadCount(0)
  }

  return (
    <div>
      {/* Leftover allocation bar */}
      {leftover > 0 && allocatableAssets.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
              You have {fmt(leftover)} leftover
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400">Allocate it to a bank or investment account</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-violet-400 text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-300 dark:hover:bg-violet-900"
            onClick={() => setShowAllocate(true)}
          >
            Allocate
          </Button>
        </div>
      )}
      {showAllocate && (
        <AllocateBudgetModal
          assets={allocatableAssets}
          leftover={leftover}
          onClose={() => setShowAllocate(false)}
        />
      )}

      {/* Tab bar — icon+label on mobile, text-only on desktop */}
      <div className="flex border-b mb-6">
        {tabs.map(({ key, label, shortLabel, icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`relative flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-1.5 py-2 md:px-4 border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {/* Icon — mobile only */}
            <span className="md:hidden">{icon}</span>
            {/* Short label on mobile, full label on desktop */}
            <span className="text-[11px] font-medium md:hidden leading-none">{shortLabel}</span>
            <span className="hidden md:inline text-sm font-medium whitespace-nowrap">{label}</span>
            {key === 'chat' && unreadCount > 0 && (
              <span className="absolute top-1 right-1 md:relative md:top-auto md:right-auto inline-flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>


      {/* Bills tab */}
      {tab === 'bills' && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              New Entry
            </h2>
            <EntryForm />
          </section>
          <div className="space-y-4">
            {monthBills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No bills due this month.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {paidCount} of {monthBills.length} paid
                </p>
                <Card className="border-t-4 border-t-orange-400 shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Due</th>
                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                              <span className="sr-only">Status / Action</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {monthBills.map((bill) => {
                            const overdue = !bill.isPaid && bill.daysLeft < 0
                            const urgent = !bill.isPaid && bill.daysLeft <= 3
                            const statusColor = bill.isPaid
                              ? 'text-green-600 dark:text-green-400'
                              : overdue
                              ? 'text-red-600 dark:text-red-400'
                              : urgent
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                            const statusLabel = bill.isPaid
                              ? bill.paidDateLabel ? `Paid · ${bill.paidDateLabel}` : 'Paid'
                              : overdue
                              ? `Overdue by ${Math.abs(bill.daysLeft)} day${Math.abs(bill.daysLeft) !== 1 ? 's' : ''}`
                              : bill.daysLeft === 0
                              ? 'Due today'
                              : bill.daysLeft === 1
                              ? 'Due tomorrow'
                              : `Due in ${bill.daysLeft} days`

                            return (
                              <tr
                                key={bill.id}
                                className={`hover:bg-muted/30 transition-colors ${bill.isPaid ? 'opacity-60' : ''}`}
                              >
                                <td className="px-6 py-3 font-medium">{bill.name}</td>
                                <td className="px-6 py-3 text-right text-muted-foreground text-xs">
                                  {bill.nextDueLabel}
                                </td>
                                <td className="px-6 py-3 text-right tabular-nums">{fmt(bill.amount)}</td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={`text-xs font-semibold whitespace-nowrap ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                    {!bill.isPaid && (
                                      <form action={payBill} className="flex items-center gap-1">
                                        <input type="hidden" name="id" value={bill.id} />
                                        {bill.variableAmount && (
                                          <input
                                            name="pay_amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            placeholder="Amount"
                                            className="h-7 w-24 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                          />
                                        )}
                                        <Button
                                          type="submit"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                                        >
                                          Pay
                                        </Button>
                                      </form>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Net Worth tab */}
      {tab === 'networth' && (
        <AssetsPanel assets={assets} userId={userId} ownerNames={ownerNames} />
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <ReportsPanel entries={entries} assets={assets} />
      )}

      {/* All Entries tab */}
      {tab === 'entries' && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              New Entry
            </h2>
            <EntryForm />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Entries
            </h2>
            <EntryList entries={entries} />
          </section>
        </div>
      )}

      {/* Chat tab — always mounted so the realtime subscription stays alive */}
      {hasFamilyMembers && (
        <div className={tab === 'chat' ? '' : 'hidden'}>
          <FamilyChat
            initialMessages={initialMessages}
            familyOwnerId={familyOwnerId}
            userId={userId}
            userNames={userNames}
            onNewMessage={handleNewMessage}
          />
        </div>
      )}
    </div>
  )
}
