'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addEntry } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PH_BANKS = [
  'BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB',
  'Security Bank', 'RCBC', 'EastWest', 'Chinabank', 'PSBank',
  'Maya', 'GCash', 'SeaBank', 'GoTyme', 'Others',
]

const EXPENSE_VENDORS = [
  { group: 'E-commerce', options: ['Lazada', 'Shopee', 'TikTok Shop'] },
  { group: 'Subscriptions', options: ['Netflix', 'Spotify', 'YouTube Premium', 'Disney+', 'Apple One'] },
  { group: 'Other', options: ['Others'] },
]

const ALL_EXPENSE_VENDORS = EXPENSE_VENDORS.flatMap(g => g.options)

const initialState = { error: null, success: false }

export function EntryForm() {
  const [state, formAction, isPending] = useActionState(addEntry, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [category, setCategory] = useState('income')
  const [bankName, setBankName] = useState(PH_BANKS[0])
  const [vendor, setVendor] = useState(ALL_EXPENSE_VENDORS[0])
  const [recurrence, setRecurrence] = useState('monthly')
  const [expenseRecurrence, setExpenseRecurrence] = useState('once')
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [variableAmount, setVariableAmount] = useState(false)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setCategory('income')
      setBankName(PH_BANKS[0])
      setVendor(ALL_EXPENSE_VENDORS[0])
      setRecurrence('monthly')
      setExpenseRecurrence('once')
      setSelectedMonths([])
      setVariableAmount(false)
    }
  }, [state.success])

  function toggleMonth(m: number) {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-wrap gap-4 sm:items-end">
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Rent" required />
          </div>
          {!variableAmount && (
            <div className="w-full sm:w-36 space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required={!variableAmount}
              />
            </div>
          )}
          <div className="w-full sm:w-36 space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="income">Income</option>
              <option value="bill">Bill</option>
              <option value="saving">Saving</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {category === 'saving' && (
            <>
              <div className="w-full sm:w-44 space-y-1.5">
                <Label htmlFor="bank_name">Bank</Label>
                <select
                  id="bank_name"
                  name="bank_name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {PH_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              {bankName === 'Others' && (
                <div className="w-full sm:w-40 space-y-1.5">
                  <Label htmlFor="custom_bank_name">Custom bank name</Label>
                  <Input
                    id="custom_bank_name"
                    name="custom_bank_name"
                    placeholder="e.g. Tonik"
                  />
                </div>
              )}
            </>
          )}

          {category === 'expense' && (
            <>
              <div className="w-full sm:w-48 space-y-1.5">
                <Label htmlFor="vendor">Vendor</Label>
                <select
                  id="vendor"
                  name="bank_name"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {EXPENSE_VENDORS.map(({ group, options }) => (
                    <optgroup key={group} label={group}>
                      {options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {vendor === 'Others' && (
                <div className="w-full sm:w-40 space-y-1.5">
                  <Label htmlFor="custom_bank_name">Custom vendor</Label>
                  <Input
                    id="custom_bank_name"
                    name="custom_bank_name"
                    placeholder="e.g. Grab, Foodpanda"
                  />
                </div>
              )}
              <div className="w-full sm:w-44 space-y-1.5">
                <Label htmlFor="expense_recurrence">Type</Label>
                <select
                  id="expense_recurrence"
                  name="recurrence"
                  value={expenseRecurrence}
                  onChange={(e) => setExpenseRecurrence(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="once">One-time purchase</option>
                  <option value="monthly">Monthly subscription</option>
                  <option value="yearly">Yearly subscription</option>
                </select>
              </div>
              {expenseRecurrence === 'once' ? (
                <div className="w-full sm:w-44 space-y-1.5">
                  <Label htmlFor="expense_due_date">Purchase date</Label>
                  <input
                    id="expense_due_date"
                    name="due_date"
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ) : (
                <>
                  {expenseRecurrence === 'yearly' && (
                    <div className="w-full sm:w-44 space-y-1.5">
                      <Label htmlFor="expense_due_month">Billing month</Label>
                      <select
                        id="expense_due_month"
                        name="due_month"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="w-full sm:w-44 space-y-1.5">
                    <Label htmlFor="expense_due_day">Billing day</Label>
                    <select
                      id="expense_due_day"
                      name="due_day"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">— none —</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          {category === 'bill' && (
            <>
              <input type="hidden" name="variable_amount" value={variableAmount ? 'true' : 'false'} />
              <div className="w-full sm:w-auto space-y-1.5 self-end pb-0.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={variableAmount}
                    onChange={(e) => setVariableAmount(e.target.checked)}
                    className="rounded"
                  />
                  Variable amount
                </label>
              </div>
              <div className="w-full sm:w-44 space-y-1.5">
                <Label htmlFor="recurrence">Recurrence</Label>
                <select
                  id="recurrence"
                  name="recurrence"
                  value={recurrence}
                  onChange={(e) => { setRecurrence(e.target.value); setSelectedMonths([]) }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="once">One-time</option>
                </select>
              </div>

              {recurrence === 'once' ? (
                <div className="w-full sm:w-44 space-y-1.5">
                  <Label htmlFor="due_date">Due date</Label>
                  <input
                    id="due_date"
                    name="due_date"
                    type="date"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ) : (
                <>
                  {recurrence === 'yearly' && (
                    <div className="w-full sm:w-44 space-y-1.5">
                      <Label htmlFor="due_month">Month</Label>
                      <select
                        id="due_month"
                        name="due_month"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {recurrence === 'quarterly' && (
                    <div className="w-full space-y-1.5">
                      <Label>Months (pick any)</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => {
                          const num = i + 1
                          const checked = selectedMonths.includes(num)
                          return (
                            <label key={num} className="flex items-center gap-1 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                name="due_months[]"
                                value={num}
                                checked={checked}
                                onChange={() => toggleMonth(num)}
                                className="rounded"
                              />
                              {m}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="w-full sm:w-44 space-y-1.5">
                    <Label htmlFor="due_day">Due on which day?</Label>
                    <select
                      id="due_day"
                      name="due_day"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">— none —</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <Button type="submit" disabled={isPending} className="shrink-0 self-end">
            {isPending ? 'Adding…' : 'Add Entry'}
          </Button>
        </form>
        {state.error && (
          <p className="mt-2 text-sm text-destructive">{state.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
