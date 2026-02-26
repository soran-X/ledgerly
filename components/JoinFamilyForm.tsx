'use client'

import { useActionState } from 'react'
import { joinFamily } from '@/app/settings/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState = { error: null }

export function JoinFamilyForm() {
  const [state, formAction, isPending] = useActionState(joinFamily, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-3">
        <Input
          name="invite_code"
          placeholder="Enter invite code"
          className="uppercase w-40 font-mono tracking-widest"
          maxLength={8}
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Joining…' : 'Join'}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
