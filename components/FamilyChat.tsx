'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'

const POLL_INTERVAL = 15000
const MY_COLOR = '#4f46e5'
const PALETTE = ['#7c3aed','#0d9488','#b91c1c','#1d4ed8','#b45309','#15803d','#a21caf','#c2410c']

function userColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % PALETTE.length
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  const d = new Date(iso), today = new Date(), yday = new Date(today)
  yday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Run = { senderId: string; msgs: Message[] }
type Day = { label: string; runs: Run[] }

function groupMessages(msgs: Message[]): Day[] {
  const days: Day[] = []
  for (const msg of msgs) {
    const label = fmtDate(msg.created_at)
    let day = days.find(d => d.label === label)
    if (!day) { day = { label, runs: [] }; days.push(day) }
    const last = day.runs[day.runs.length - 1]
    if (last && last.senderId === msg.sender_id) last.msgs.push(msg)
    else day.runs.push({ senderId: msg.sender_id, msgs: [msg] })
  }
  return days
}

export function FamilyChat({
  initialMessages, familyOwnerId, userId, userNames, onNewMessage,
}: {
  initialMessages: Message[]
  familyOwnerId: string
  userId: string
  userNames: Record<string, string>
  onNewMessage?: (senderName: string, content: string) => void
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [live, setLive]         = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const supabase  = useRef(createClient()).current

  // Reliable mobile detection via JS — avoids Tailwind responsive class issues
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  const isNearBottom = useCallback(() => {
    const el = listRef.current
    return el ? el.scrollHeight - el.scrollTop - el.clientHeight < 160 : true
  }, [])

  const addOrReplace = useCallback((msg: Message, replaceId?: string) => {
    setMessages(prev => {
      const without = replaceId ? prev.filter(m => m.id !== replaceId) : prev
      if (without.some(m => m.id === msg.id)) return without
      return [...without, msg].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
  }, [])

  const mergeMany = useCallback((incoming: Message[]) => {
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id))
      const added = incoming.filter(m => !ids.has(m.id))
      if (!added.length) return prev
      return [...prev, ...added].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
  }, [])

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${familyOwnerId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `family_owner_id=eq.${familyOwnerId}` },
        ({ new: msg }) => {
          addOrReplace(msg as Message)
          if ((msg as Message).sender_id !== userId) {
            const name = userNames[(msg as Message).sender_id] ?? 'Someone'
            onNewMessage?.(name, (msg as Message).content)
          }
        }
      )
      .subscribe(s => setLive(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyOwnerId])

  useEffect(() => {
    const poll = async () => {
      const { data } = await supabase
        .from('messages').select('*')
        .eq('family_owner_id', familyOwnerId)
        .order('created_at', { ascending: true }).limit(100)
      if (data) mergeMany(data as Message[])
    }
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [familyOwnerId, mergeMany, supabase])

  useEffect(() => {
    if (isNearBottom()) scrollToBottom()
  }, [messages, isNearBottom, scrollToBottom])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    inputRef.current?.focus()

    const tempId = `pending-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId, family_owner_id: familyOwnerId,
      sender_id: userId, content, created_at: new Date().toISOString(),
    }])
    scrollToBottom()

    const { data, error } = await supabase
      .from('messages')
      .insert({ family_owner_id: familyOwnerId, sender_id: userId, content })
      .select().single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
      toast.error('Failed to send. Please try again.')
    } else if (data) {
      addOrReplace(data as Message, tempId)
    }
    setSending(false)
  }

  const days = groupMessages(messages)

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border shadow-lg bg-card" style={{ height: 600 }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-semibold text-sm">Family Chat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${live === null ? 'bg-muted-foreground' : live ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-xs text-muted-foreground">
            {live === null ? 'Connecting…' : live ? 'Live' : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto" style={{ background: 'oklch(0.975 0.004 286)' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center select-none">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground -mt-2">Say hi to your family! 👋</p>
          </div>
        ) : (
          <div className="py-4">
            {days.map(({ label, runs }) => (
              <div key={label}>

                {/* Date separator */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] font-medium text-muted-foreground bg-border/40 px-3 py-0.5 rounded-full shrink-0">{label}</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {runs.map((run, ri) => {
                  const isMe    = run.senderId === userId
                  const name    = userNames[run.senderId] ?? 'Unknown'
                  const color   = isMe ? MY_COLOR : userColor(run.senderId)
                  const lastMsg = run.msgs[run.msgs.length - 1]
                  const isPending = lastMsg.id.startsWith('pending-')

                  if (isMobile) {
                    // ── MOBILE: bubbles + chat heads ──
                    return (
                      <div
                        key={`${label}-${ri}`}
                        className="flex items-end gap-2 px-3 py-1"
                        style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}
                      >
                        {!isMe && (
                          <div
                            className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white select-none"
                            style={{ background: color }}
                          >
                            {initials(name)}
                          </div>
                        )}
                        <div
                          className="flex flex-col gap-0.5 max-w-[75%]"
                          style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}
                        >
                          {!isMe && (
                            <span className="text-[11px] font-medium px-1" style={{ color }}>{name}</span>
                          )}
                          {run.msgs.map(msg => (
                            <div
                              key={msg.id}
                              className={`px-3 py-2 text-sm leading-relaxed ${
                                isMe ? 'rounded-2xl rounded-tr-sm text-white' : 'rounded-2xl rounded-tl-sm text-foreground'
                              }`}
                              style={{
                                background: isMe ? MY_COLOR : '#e2e2ea',
                                opacity: msg.id.startsWith('pending-') ? 0.6 : 1,
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.content}
                            </div>
                          ))}
                          <span className="text-[10px] text-muted-foreground px-1">
                            {isPending ? 'Sending…' : fmtTime(lastMsg.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  // ── DESKTOP: plain text, no bubbles, no avatars, no backgrounds ──
                  return (
                    <div key={`${label}-${ri}`} className="px-4 py-2">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color }}>
                          {isMe ? 'You' : name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isPending ? 'Sending…' : fmtTime(lastMsg.created_at)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {run.msgs.map(msg => (
                          <p
                            key={msg.id}
                            className="text-sm leading-relaxed text-foreground"
                            style={{ wordBreak: 'break-word', opacity: msg.id.startsWith('pending-') ? 0.6 : 1 }}
                          >
                            {msg.content}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-t bg-card">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) }
          }}
          placeholder="Type a message…"
          disabled={sending}
          autoComplete="off"
          className="flex-1 h-10 rounded-full bg-muted/60 border border-border/50 px-4 text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className={`shrink-0 flex items-center justify-center gap-1.5 text-white font-medium text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 shadow-sm ${
            isMobile ? 'h-10 w-10 rounded-full' : 'h-10 px-4 rounded-full'
          }`}
          style={{ background: `linear-gradient(135deg, ${MY_COLOR} 0%, #8b5cf6 100%)` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z"/>
          </svg>
          {!isMobile && <span>{sending ? 'Sending…' : 'Send'}</span>}
        </button>
      </form>
    </div>
  )
}
