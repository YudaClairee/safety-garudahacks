import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'warga' | 'corporate'>('warga')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      if (mode === 'register') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          throw signUpError
        }

        if (signUpData.user) {
          // Update the public.users table with the selected role and name immediately after signup
          const { error: updateError } = await supabase
            .from('users')
            .update({ role, full_name: fullName.trim() })
            .eq('id', signUpData.user.id)
          
          if (updateError) {
            console.error('Failed to set role and name:', updateError)
          }
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      setFeedback('Berhasil masuk. Mengarahkan ke dashboard...')
      router.navigate({ to: '/dashboard' })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses autentikasi.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logojalan-transparant.png" alt="Jalan Logo" className="h-12 w-auto object-contain mb-2" />
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gunakan email dan password untuk masuk atau daftar.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('warga')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition cursor-pointer ${
                    role === 'warga'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Warga (Relawan)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('corporate')}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition cursor-pointer ${
                    role === 'corporate'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Perusahaan (CSR)
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="fullName">
                {role === 'warga' ? 'Nama Lengkap' : 'Nama Perusahaan'}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={role === 'warga' ? 'Nama Lengkap Anda' : 'Nama Perusahaan Anda'}
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {feedback ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {feedback}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setFeedback(null)
                }}
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setFeedback(null)
                }}
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
