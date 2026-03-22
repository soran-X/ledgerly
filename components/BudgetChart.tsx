'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type Props = {
  income: number
  bills: number
  savings: number
  expenses: number
}

const BARS = [
  { key: 'income',   label: 'Income',   color: '#10b981' },
  { key: 'bills',    label: 'Bills',    color: '#f43f5e' },
  { key: 'savings',  label: 'Savings',  color: '#38bdf8' },
  { key: 'expenses', label: 'Expenses', color: '#8b5cf6' },
]

function abbrev(n: number) {
  if (n >= 1_000_000) return '₱' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '₱' + (n / 1_000).toFixed(0) + 'K'
  return '₱' + n.toLocaleString('en-PH')
}

export function BudgetChart({ income, bills, savings, expenses }: Props) {
  const data = [
    { name: 'Income',   value: income,   color: '#10b981' },
    { name: 'Bills',    value: bills,    color: '#f43f5e' },
    { name: 'Savings',  value: savings,  color: '#38bdf8' },
    { name: 'Expenses', value: expenses, color: '#8b5cf6' },
  ]

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground mb-4">Budget Breakdown</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={40} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            formatter={(value) => [abbrev(value as number), '']}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.08)',
              fontSize: '13px',
              padding: '6px 12px',
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
