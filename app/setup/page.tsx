import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setupSavings } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PH_BANKS = [
  'BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB',
  'Security Bank', 'RCBC', 'EastWest', 'Chinabank', 'PSBank',
  'Maya', 'GCash', 'SeaBank', 'GoTyme',
]

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the current balance for each bank account you have. Leave blank to skip.
          </p>
        </div>

        <form action={setupSavings} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PH_BANKS.map((bank) => (
              <Card key={bank} className="shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold">{bank}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <Input
                    name={`bank_${bank}`}
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </CardContent>
              </Card>
            ))}

            {/* Others card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">Others</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <Input
                  name="bank_others_name"
                  placeholder="Bank name"
                />
                <Input
                  name="bank_others_amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">Save & Continue</Button>
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              Skip for now
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
