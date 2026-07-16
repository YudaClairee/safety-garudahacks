import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    // If accessing exactly /dashboard, redirect to the correct sub-route based on role
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error)
      }

      if (user?.role === 'corporate') {
        throw redirect({ to: '/dashboard/corporate' })
      } else {
        throw redirect({ to: '/dashboard/warga' })
      }
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  return <Outlet />
}
