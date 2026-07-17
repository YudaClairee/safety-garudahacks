import { useEffect, useState } from 'react'
import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    if (typeof window === 'undefined') {
      return
    }

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
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) return

      if (!session) {
        router.navigate({
          to: '/login',
          search: {
            redirect: window.location.pathname + window.location.search,
          },
        })
        return
      }

      if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') {
        const { data: user, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!isMounted) return

        if (error) {
          console.error('Error fetching user role:', error)
        }

        router.navigate({
          to: user?.role === 'corporate' ? '/dashboard/corporate' : '/dashboard/warga',
          replace: true,
        })
        return
      }

      setIsCheckingSession(false)
      void router.invalidate()
    }

    void checkSession()

    return () => {
      isMounted = false
    }
  }, [router])

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="rounded-3xl border border-border bg-card/80 px-6 py-5 text-sm text-muted-foreground shadow-lg shadow-black/5 backdrop-blur-xl">
          Memeriksa sesi login...
        </div>
      </main>
    )
  }

  return <Outlet />
}
