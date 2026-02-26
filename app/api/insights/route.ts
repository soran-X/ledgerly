import { NextResponse, NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // NEW: Check if the frontend is requesting a forced update
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.get('force') === 'true'

  // CACHE CHECK: Only check the cache if we aren't forcing a refresh
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('user_insights')
      .select('insights, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      const ageInHours = (new Date().getTime() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60)
      if (ageInHours < 24) {
        // Return cached JSON, bypassing Gemini entirely
        return NextResponse.json(cached.insights)
      }
    }
  }

  // Fetch fresh financial data
  const [{ data: entries }, { data: assets }] = await Promise.all([
    supabase.from('entries').select('category, name, amount, recurrence'),
    supabase.from('assets').select('type, name, value'),
  ])

  // Aggregate calculations
  const income = entries?.filter(e => e.category === 'income').reduce((s, e) => s + e.amount, 0) ?? 0
  const billTotal = entries?.filter(e => e.category === 'bill').reduce((s, e) => s + e.amount, 0) ?? 0
  const savingsTotal = entries?.filter(e => e.category === 'saving').reduce((s, e) => s + e.amount, 0) ?? 0
  const leftover = income - billTotal - savingsTotal
  const totalAssets = assets?.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0) ?? 0
  const totalLiabilities = assets?.filter(a => a.type === 'liability' || a.type === 'mortgage').reduce((s, a) => s + a.value, 0) ?? 0
  const netWorth = totalAssets - totalLiabilities
  const savingsRate = income > 0 ? (savingsTotal / income * 100).toFixed(1) : '0'
  const billRate = income > 0 ? (billTotal / income * 100).toFixed(1) : '0'

  // Format lists for the prompt
  const billsList = entries?.filter(e => e.category === 'bill')
    .map(e => `${e.name} ₱${e.amount.toLocaleString()} (${e.recurrence ?? 'monthly'})`)
    .join('; ') || 'none'

  const savingsList = entries?.filter(e => e.category === 'saving')
    .map(e => `${e.name} ₱${e.amount.toLocaleString()}`)
    .join(', ') || 'none'

  const incomeList = entries?.filter(e => e.category === 'income')
    .map(e => `${e.name} ₱${e.amount.toLocaleString()}`)
    .join(', ') || 'none'

  const prompt = `You are a friendly, concise personal finance advisor for a Filipino household. Analyze this budget data and generate exactly 4 focused insights.

Financial Snapshot:
- Income sources: ${incomeList} → Total: ₱${income.toLocaleString()}/month
- Bills: ${billsList} → Total: ₱${billTotal.toLocaleString()}/month (${billRate}% of income)
- Savings: ${savingsList} → Total: ₱${savingsTotal.toLocaleString()}/month (${savingsRate}% of income)
- Leftover balance: ₱${leftover.toLocaleString()}/month
- Total assets: ₱${totalAssets.toLocaleString()} | Total liabilities: ₱${totalLiabilities.toLocaleString()}
- Net worth: ₱${netWorth.toLocaleString()}

Output exactly this JSON (no markdown, no extra text):
{"insights":[{"type":"positive","title":"...","body":"..."},{"type":"warning","title":"...","body":"..."},{"type":"tip","title":"...","body":"..."},{"type":"info","title":"...","body":"..."}]}

Type rules:
- positive → celebrate a good habit in this data
- warning → flag an area needing attention (be specific with numbers)
- tip → one concrete saving or budgeting action they can take now
- info → a neutral observation or comparison to benchmarks

Constraints:
- title: max 7 words, engaging
- body: 2 sentences max, specific to their actual numbers, use ₱ for amounts
- be warm and encouraging, not preachy
- if income is 0, note data looks sparse and give general setup tips`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const parsed = JSON.parse(text)

    // CACHE UPDATE: Save the newly generated insights to Supabase
    // Because we order by created_at in our read query, this new insert 
    // automatically becomes the active cached version.
    await supabase.from('user_insights').insert({
      user_id: user.id,
      insights: parsed
    })

    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Insights error:', error)
    
    // 429 Rate Limit Handling
    if (error.message?.includes('429') || error.status === 429) {
      const match = error.message?.match(/retry in (\d+\.?\d*)s/)
      const retryDelaySeconds = match ? Math.ceil(parseFloat(match[1])) : 60

      return NextResponse.json(
        { 
          error: 'AI is taking a quick breather due to high demand. Please wait a moment.', 
          retryAfter: retryDelaySeconds 
        }, 
        { 
          status: 429,
          headers: { 'Retry-After': retryDelaySeconds.toString() }
        }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI returned unexpected format. Try refreshing.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to generate insights.' }, { status: 500 })
  }
}