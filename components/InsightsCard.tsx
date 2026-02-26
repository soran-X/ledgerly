'use client'

import { useState, useEffect, useCallback } from 'react'

type InsightType = 'positive' | 'warning' | 'tip' | 'info'

type Insight = {
  type: InsightType
  title: string
  body: string
}

const TYPE_CONFIG: Record<InsightType, {
  icon: string
  borderColor: string
  bgClass: string
  titleClass: string
}> = {
  positive: {
    icon: '📈',
    borderColor: 'border-l-green-500',
    bgClass: 'bg-green-50 dark:bg-green-950/25',
    titleClass: 'text-green-800 dark:text-green-300',
  },
  warning: {
    icon: '⚠️',
    borderColor: 'border-l-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-950/25',
    titleClass: 'text-amber-800 dark:text-amber-300',
  },
  tip: {
    icon: '💡',
    borderColor: 'border-l-sky-500',
    bgClass: 'bg-sky-50 dark:bg-sky-950/25',
    titleClass: 'text-sky-800 dark:text-sky-300',
  },
  info: {
    icon: 'ℹ️',
    borderColor: 'border-l-primary',
    bgClass: 'bg-secondary/60',
    titleClass: 'text-foreground',
  },
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border-l-4 border-l-muted p-4 bg-muted/40 space-y-2">
          <div className="h-3.5 w-2/5 rounded-full bg-muted" />
          <div className="h-3 w-full rounded-full bg-muted" />
          <div className="h-3 w-4/5 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function InsightsCard() {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // NEW: State for tracking the rate limit countdown
  const [countdown, setCountdown] = useState(0)

  // UPDATED: Accept a 'force' parameter to bypass cache
  const fetchInsights = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Append ?force=true if the user clicked the manual refresh button
      const url = force ? '/api/insights?force=true' : '/api/insights'
      const res = await fetch(url)
      const data = await res.json()

      // NEW: Handle the 429 Rate Limit error gracefully
      if (res.status === 429) {
        setError(data.error || 'AI is taking a quick breather.')
        setCountdown(data.retryAfter || 60)
        return // Exit early so we don't clear the insights or throw a standard error
      }

      if (!res.ok) throw new Error(data.error ?? 'Failed to load insights')
      
      // If the backend returns `cached.insights` directly it might be an array, 
      // or if it returns `parsed` it will be `{ insights: [...] }`.
      setInsights(data.insights || data) 
      setCountdown(0) // Reset countdown on success
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { 
    fetchInsights() 
  }, [fetchInsights])

  // NEW: The Countdown Effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
    
    // Auto-retry when the timer hits zero
    if (countdown === 0 && error && error.includes('breather')) {
      fetchInsights()
    }
  }, [countdown, error, fetchInsights])

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          ✨ AI Insights &amp; Tips
        </h2>
        {/* UPDATED: Disable the button while loading or counting down, and pass force=true */}
        {!loading && countdown === 0 && (
          <button
            onClick={() => fetchInsights(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton />
      ) : countdown > 0 ? (
        // NEW: Rate Limit Warning UI
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <p>{error}</p>
          <p className="mt-1 font-mono text-xs opacity-80">
            Retrying automatically in {countdown}s...
          </p>
        </div>
      ) : error ? (
        // Existing Error UI
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error.includes('GEMINI_API_KEY')
            ? <>Add <code className="font-mono text-xs bg-destructive/10 px-1 rounded">GEMINI_API_KEY</code> to your <code className="font-mono text-xs bg-destructive/10 px-1 rounded">.env.local</code> to enable AI insights.</>
            : error}
        </div>
      ) : (
        // Existing Success UI
        <div className="grid gap-3 sm:grid-cols-2">
          {insights?.map((insight, i) => {
            const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info
            return (
              <div
                key={i}
                className={`rounded-xl border-l-4 ${cfg.borderColor} ${cfg.bgClass} p-4 shadow-sm`}
              >
                <p className={`flex items-center gap-1.5 text-sm font-semibold mb-1 ${cfg.titleClass}`}>
                  <span aria-hidden>{cfg.icon}</span>
                  {insight.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
