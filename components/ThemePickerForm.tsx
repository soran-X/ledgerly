'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateFamilyTheme } from '@/app/settings/actions'
import { THEMES, type ThemeKey } from '@/lib/themes'

export function ThemePickerForm({ currentTheme }: { currentTheme: string }) {
  const safeTheme: ThemeKey = (currentTheme in THEMES ? currentTheme : 'default') as ThemeKey
  const [selected, setSelected] = useState<ThemeKey>(safeTheme)

  return (
    <form action={updateFamilyTheme} className="space-y-4">
      <input type="hidden" name="theme" value={selected} />
      <div className="flex flex-wrap gap-3">
        {(Object.entries(THEMES) as [ThemeKey, (typeof THEMES)[ThemeKey]][]).map(([key, theme]) => (
          <button
            key={key}
            type="button"
            title={theme.label}
            onClick={() => setSelected(key)}
            className={`h-9 w-9 rounded-full transition-all duration-150 ${
              selected === key
                ? 'ring-2 ring-offset-2 ring-foreground scale-110 shadow-md'
                : 'ring-1 ring-offset-1 ring-border hover:scale-105'
            }`}
            style={{ background: theme.preview }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {THEMES[selected].label}
        </span>
        <Button type="submit" size="sm">Apply Theme</Button>
      </div>
    </form>
  )
}
