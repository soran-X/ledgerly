import Link from 'next/link'
import { LogoMark, LogoWordmark } from '@/components/Logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <LogoWordmark iconSize={32} />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mb-6 flex justify-center">
            <LogoMark size={72} />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            Open Source · Free for Everyone
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your family&apos;s financial<br className="hidden sm:block" /> command center
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Track income, bills, savings, investments, and net worth — all in one place.
            Built for families, powered by AI, free and open source.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/login"
              className="rounded-md border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Log In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-2 text-center text-2xl font-bold tracking-tight">Everything you need, nothing you don&apos;t</h2>
            <p className="mb-12 text-center text-sm text-muted-foreground">A focused finance tracker built for real households.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              <FeatureCard
                icon={<DashboardIcon />}
                title="Financial Dashboard"
                description="Snapshot your total income, bills, savings, expenses, leftover balance, and net worth at a glance — updated in real time."
              />

              <FeatureCard
                icon={<BillIcon />}
                title="Bill Tracker"
                description="Track monthly, quarterly, yearly, or one-time bills with due dates. Get overdue and urgent alerts. Mark bills as paid with a single click."
              />

              <FeatureCard
                icon={<NetWorthIcon />}
                title="Net Worth Tracking"
                description="Record assets, investments, liabilities, and mortgages — including conjugal properties. Know exactly where you stand financially."
              />

              <FeatureCard
                icon={<AIIcon />}
                title="AI-Powered Insights"
                description="Claude AI (Anthropic) analyzes your finances and delivers personalized tips, warnings, and positive reinforcements every time you check in."
              />

              <FeatureCard
                icon={<FamilyIcon />}
                title="Family Finance"
                description="Invite family members to a shared ledger. View combined finances, manage shared assets, and assign per-family color themes."
              />

              <FeatureCard
                icon={<ChatIcon />}
                title="Real-time Family Chat"
                description="Discuss finances with your family in a built-in chat room, powered by Supabase Realtime with a polling fallback."
              />

              <FeatureCard
                icon={<ReportsIcon />}
                title="Financial Reports"
                description="Run a bill cost analyzer, see upcoming bills for the next 90 days, and generate a full net worth report with monthly cash flow breakdown."
              />

              <FeatureCard
                icon={<AllocationIcon />}
                title="Smart Budget Allocation"
                description="Allocate leftover budget directly to a bank account or investment with one click — no spreadsheet gymnastics required."
              />

              <FeatureCard
                icon={<ThemeIcon />}
                title="Custom Themes"
                description="Choose from 6 accent color themes: violet, indigo, rose, emerald, sky, and amber. Each family can have its own look."
              />

            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">Built on a modern stack</h2>
            <p className="mb-10 text-sm text-muted-foreground">Fast, reliable, and built for the long term.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                'Next.js 16',
                'React 19',
                'TypeScript',
                'Supabase',
                'Claude AI',
                'Tailwind CSS v4',
                'shadcn/ui',
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight">Free &amp; Open Source</h2>
            <p className="mb-6 text-muted-foreground">
              Ledgerly is open source software. Anyone can sign up, use it for free, inspect the code, and contribute.
              No paywalls, no hidden fees, no subscription traps.
            </p>
            <Link
              href="/signup"
              className="inline-flex rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              Create a Free Account
            </Link>
          </div>
        </section>

        {/* Built by */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-sm text-muted-foreground">Built with care by</p>
            <a
              href="https://jamesalain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xl font-bold text-primary hover:underline transition-colors"
            >
              James Alain Dantes
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              <a
                href="https://jamesalain.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                jamesalain.com
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <span className="text-sm font-semibold text-primary">Ledgerly</span>
          <p className="text-xs text-muted-foreground">
            Open source · Free forever · Built by{' '}
            <a
              href="https://jamesalain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              James Alain Dantes
            </a>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}

function BillIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function NetWorthIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

function AIIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
    </svg>
  )
}

function FamilyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}

function AllocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
  )
}

function ThemeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
}
