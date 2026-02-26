import { deleteEntry, payBill } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Entry } from '@/lib/types'

const categoryStyle: Record<string, string> = {
  income: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  bill: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  saving: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  expense: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

const categoryLabel: Record<string, string> = {
  income: 'Income',
  bill: 'Bill',
  saving: 'Saving',
  expense: 'Expense',
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function recurrenceBadge(entry: Entry): { label: string; overdue: boolean } | null {
  const rec = entry.recurrence ?? 'monthly'
  if (entry.category !== 'bill' && entry.category !== 'expense') return null

  if (rec === 'once') {
    if (!entry.due_date) return null
    const due = new Date(entry.due_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = due < today
    const label = overdue
      ? `Overdue · ${MONTH_NAMES[due.getMonth()]} ${ordinal(due.getDate())} ${due.getFullYear()}`
      : `Due ${MONTH_NAMES[due.getMonth()]} ${ordinal(due.getDate())} ${due.getFullYear()}`
    return { label, overdue }
  }

  if (entry.due_day == null) return null

  if (rec === 'yearly') {
    const monthName = entry.due_month ? MONTH_NAMES[entry.due_month - 1] : '?'
    return { label: `Yearly · ${monthName} ${ordinal(entry.due_day)}`, overdue: false }
  }

  if (rec === 'quarterly') {
    return { label: `Quarterly · ${ordinal(entry.due_day)}`, overdue: false }
  }

  // monthly (default)
  return { label: `Due ${ordinal(entry.due_day)}`, overdue: false }
}

export function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Entries</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No entries yet. Add your first one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => {
                  const deleteWithId = deleteEntry.bind(null, entry.id)
                  return (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-medium">{entry.name}</span>
                        {(entry.category === 'saving' || entry.category === 'expense') && entry.bank_name && (
                          <span className="ml-2 text-xs text-muted-foreground">{entry.bank_name}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle[entry.category]}`}
                        >
                          {categoryLabel[entry.category]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        <span>₱{entry.amount.toFixed(2)}</span>
                        {entry.last_paid_date && (() => {
                          const d = new Date(entry.last_paid_date + 'T00:00:00')
                          const label = `Paid · ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
                          return (
                            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                              {label}
                            </span>
                          )
                        })()}
                        {!entry.last_paid_date && (() => {
                          const badge = recurrenceBadge(entry)
                          if (!badge) return null
                          return (
                            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              badge.overdue
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {badge.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.category === 'bill' && (
                            <form action={payBill} className="flex items-center gap-1">
                              <input type="hidden" name="id" value={entry.id} />
                              {entry.variable_amount && (
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
                          <form action={deleteWithId}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                            >
                              Delete
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
