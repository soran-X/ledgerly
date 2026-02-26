import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        Sign Out
      </Button>
    </form>
  )
}
