export type ThemeKey = 'default' | 'indigo' | 'rose' | 'emerald' | 'sky' | 'amber'

// 'default' matches the base globals.css (violet hue 292) — no style injection needed
export const THEMES: Record<ThemeKey, {
  label: string
  preview: string
  light: string  // --primary in :root
  dark: string   // --primary in .dark
}> = {
  default: { label: 'Violet',  preview: '#7c3aed', light: 'oklch(0.558 0.24 292)',  dark: 'oklch(0.692 0.21 292)'  },
  indigo:  { label: 'Indigo',  preview: '#4f46e5', light: 'oklch(0.545 0.205 278)', dark: 'oklch(0.68 0.185 278)'  },
  rose:    { label: 'Rose',    preview: '#e11d48', light: 'oklch(0.545 0.205 10)',  dark: 'oklch(0.68 0.185 10)'   },
  emerald: { label: 'Emerald', preview: '#059669', light: 'oklch(0.545 0.205 152)', dark: 'oklch(0.68 0.185 152)'  },
  sky:     { label: 'Sky',     preview: '#0284c7', light: 'oklch(0.545 0.205 215)', dark: 'oklch(0.68 0.185 215)'  },
  amber:   { label: 'Amber',   preview: '#d97706', light: 'oklch(0.545 0.205 74)',  dark: 'oklch(0.68 0.185 74)'   },
}

export function themeStyleTag(themeKey: string): string | null {
  if (themeKey === 'default' || !(themeKey in THEMES)) return null
  const t = THEMES[themeKey as ThemeKey]
  return `
    :root { --primary: ${t.light}; --ring: ${t.light}; --sidebar-primary: ${t.light}; --sidebar-ring: ${t.light}; }
    .dark  { --primary: ${t.dark};  --ring: ${t.dark};  --sidebar-primary: ${t.dark};  --sidebar-ring: ${t.dark};  }
  `
}
