'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addAsset, updateAsset, deleteAsset } from '@/app/assets/actions'
import type { Asset, AssetType } from '@/lib/types'

const TYPE_LABELS: Record<AssetType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  mortgage: 'Mortgage',
  investment: 'Investment',
}

const TYPE_COLORS: Record<AssetType, string> = {
  asset: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  mortgage: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  investment: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
}

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function NetWorthSummary({ assets }: { assets: Asset[] }) {
  const totalAssets = assets.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
  const totalInvestments = assets.filter(a => a.type === 'investment').reduce((s, a) => s + a.value, 0)
  const totalLiabilities = assets
    .filter(a => a.type === 'liability' || a.type === 'mortgage')
    .reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets + totalInvestments - totalLiabilities

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Assets</p>
        <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">{fmt(totalAssets)}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Investments</p>
        <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{fmt(totalInvestments)}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Liabilities</p>
        <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{fmt(totalLiabilities)}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Worth</p>
        <p className={`mt-1 text-lg font-bold tabular-nums ${netWorth >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-destructive'}`}>
          {fmt(netWorth)}
        </p>
      </div>
    </div>
  )
}

function AddAssetForm() {
  const [type, setType] = useState<AssetType>('asset')
  const [conjugal, setConjugal] = useState(false)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Add Asset / Liability</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={addAsset} className="flex flex-wrap gap-4 sm:items-end">
          <input type="hidden" name="conjugal" value={conjugal ? 'true' : 'false'} />

          <div className="flex-1 min-w-[140px] space-y-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input id="asset-name" name="name" placeholder="e.g. House, Car loan" required />
          </div>

          <div className="w-full sm:w-36 space-y-1.5">
            <Label htmlFor="asset-type">Type</Label>
            <select
              id="asset-type"
              name="type"
              value={type}
              onChange={e => setType(e.target.value as AssetType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="mortgage">Mortgage</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div className="w-full sm:w-36 space-y-1.5">
            <Label htmlFor="asset-value">Value (₱)</Label>
            <Input id="asset-value" name="value" type="number" placeholder="0.00" step="0.01" min="0" required />
          </div>

          <div className="w-full sm:w-48 space-y-1.5">
            <Label htmlFor="asset-notes">Notes</Label>
            <Input id="asset-notes" name="notes" placeholder="Optional notes" />
          </div>

          <div className="w-full sm:w-auto space-y-1.5 self-end pb-0.5">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={conjugal}
                onChange={e => setConjugal(e.target.checked)}
                className="rounded"
              />
              Conjugal property
            </label>
          </div>

          <Button type="submit" className="shrink-0 self-end">Add</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function AssetRow({
  asset,
  ownerName,
  canEdit,
}: {
  asset: Asset
  ownerName: string
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editType, setEditType] = useState<AssetType>(asset.type)
  const [editConjugal, setEditConjugal] = useState(asset.conjugal)
  const deleteWithId = deleteAsset.bind(null, asset.id)

  if (editing) {
    return (
      <tr className="bg-muted/30">
        <td colSpan={6} className="px-6 py-4">
          <form
            action={updateAsset}
            onSubmit={() => setEditing(false)}
            className="flex flex-wrap gap-3 items-end"
          >
            <input type="hidden" name="id" value={asset.id} />
            <input type="hidden" name="conjugal" value={editConjugal ? 'true' : 'false'} />

            <div className="flex-1 min-w-[120px] space-y-1">
              <Label className="text-xs">Name</Label>
              <Input name="name" defaultValue={asset.name} required className="h-8 text-sm" />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                name="type"
                value={editType}
                onChange={e => setEditType(e.target.value as AssetType)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="mortgage">Mortgage</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">Value (₱)</Label>
              <Input name="value" type="number" step="0.01" min="0" defaultValue={asset.value} required className="h-8 text-sm" />
            </div>
            <div className="flex-1 min-w-[120px] space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input name="notes" defaultValue={asset.notes ?? ''} className="h-8 text-sm" />
            </div>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer self-end pb-1">
              <input
                type="checkbox"
                checked={editConjugal}
                onChange={e => setEditConjugal(e.target.checked)}
                className="rounded"
              />
              Conjugal
            </label>
            <div className="flex gap-2 self-end">
              <Button type="submit" size="sm" className="h-8">Save</Button>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-3 font-medium">
        {asset.name}
        {asset.conjugal && (
          <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200">
            Conjugal
          </span>
        )}
      </td>
      <td className="px-6 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[asset.type]}`}>
          {TYPE_LABELS[asset.type]}
        </span>
      </td>
      <td className="px-6 py-3 text-right tabular-nums font-medium">
        {fmt(asset.value)}
      </td>
      <td className="px-6 py-3 text-sm text-muted-foreground">{ownerName}</td>
      <td className="px-6 py-3 text-sm text-muted-foreground">{asset.notes ?? '—'}</td>
      <td className="px-6 py-3 text-right">
        {canEdit && (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <form action={deleteWithId}>
              <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                Delete
              </Button>
            </form>
          </div>
        )}
      </td>
    </tr>
  )
}

export function AssetsPanel({
  assets,
  userId,
  ownerNames,
}: {
  assets: Asset[]
  userId: string
  ownerNames: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <AddAssetForm />

      {assets.length > 0 && (
        <>
          <NetWorthSummary assets={assets} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Assets &amp; Liabilities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Value</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Owner</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Notes</th>
                      <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assets.map(asset => (
                      <AssetRow
                        key={asset.id}
                        asset={asset}
                        ownerName={ownerNames[asset.user_id] ?? 'Unknown'}
                        canEdit={asset.user_id === userId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {assets.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">No assets recorded yet.</p>
      )}
    </div>
  )
}
