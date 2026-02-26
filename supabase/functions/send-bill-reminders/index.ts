import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (_req) => {
  // Philippine time: UTC+8
  const nowPH = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const todayDay = nowPH.getUTCDate()
  const todayMonth = nowPH.getUTCMonth() + 1
  const todayStr = `${nowPH.getUTCFullYear()}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: rows, error } = await supabase.rpc('get_bills_due_today', {
    p_due_day: todayDay,
    p_due_month: todayMonth,
    p_today: todayStr,
  })

  if (error) {
    console.error('RPC error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const billRows: { name: string; amount: number; email: string }[] = rows ?? []

  console.log(`Date: ${todayStr}, rows found: ${billRows.length}`)

  if (billRows.length === 0) {
    return new Response(JSON.stringify({ sent: 0, day: todayDay }), { status: 200 })
  }

  // Group by email
  const byEmail = new Map<string, { name: string; amount: number }[]>()
  for (const row of billRows) {
    if (!byEmail.has(row.email)) byEmail.set(row.email, [])
    byEmail.get(row.email)!.push({ name: row.name, amount: row.amount })
  }

  let sent = 0
  for (const [email, bills] of byEmail) {
    const billList = bills
      .map((b) => `<li><strong>${b.name}</strong> — ₱${b.amount.toFixed(2)}</li>`)
      .join('')

    const html = `
      <h2>📋 Bill Reminder from Ledgerly</h2>
      <p>The following bills are due <strong>today</strong>:</p>
      <ul>${billList}</ul>
      <p style="color:#888;font-size:12px;">You're receiving this because you set up recurring bills in Ledgerly.</p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ledgerly <onboarding@resend.dev>',
        to: 'jamesd@clinicdev.com', // TODO: change to `email` after verifying a domain in Resend
        subject: `Bill reminder: ${bills.length} bill${bills.length > 1 ? 's' : ''} due today`,
        html,
      }),
    })

    if (res.ok) {
      sent++
      console.log('Email sent to', email)
    } else {
      const body = await res.text()
      console.error('Resend error for', email, res.status, body)
    }
  }

  return new Response(JSON.stringify({ sent, day: todayDay, total: billRows.length }), { status: 200 })
})
