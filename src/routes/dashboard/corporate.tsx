import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CSRProgram } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Target,
  Activity,
  ArrowUpRight,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/corporate')({
  loader: async () => {
    const { data: programsData, error: programsError } = await supabase
      .from('csr_programs')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, type, status, photo_url, created_at, users(email)')
      .order('created_at', { ascending: false })

    if (programsError)
      console.error('Error fetching CSR programs:', programsError)
    if (tasksError) console.error('Error fetching tasks:', tasksError)

    return {
      programs: (programsData || []) as CSRProgram[],
      tasks: (tasksData || []) as any[],
    }
  },
  component: CorporateDashboard,
})

function CorporateDashboard() {
  const { programs, tasks } = Route.useLoaderData()
  const router = useRouter()

  const [isSimulating, setIsSimulating] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.navigate({ to: '/login' })
  }

  async function handleTriggerAutomation() {
    setIsSimulating(true)
    try {
      const res = await fetch('/api/trigger-automation', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Simulasi Webhook sukses! ${data.message || ''}\nJumlah tugas diproses: ${data.processedCount || 0}`)
        router.invalidate() // Refetch data
      } else {
        alert(`Gagal menjalankan simulasi: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert(`Terjadi kesalahan: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSimulating(false)
    }
  }

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [budget, setBudget] = useState('')
  const [errors, setErrors] = useState<{
    companyName?: string
    budget?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Metrics calculation
  const totalBudgetAllocated = programs.reduce(
    (sum, p) => sum + (Number(p.budget_rupiah) || 0),
    0,
  )
  const totalFundedTasks = programs.reduce(
    (sum, p) => sum + (p.tasks_funded || 0),
    0,
  )
  const activeProgramsCount = programs.length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}

    if (!companyName.trim()) {
      newErrors.companyName = 'Nama perusahaan wajib diisi'
    }

    const budgetNum = Number(budget)
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      newErrors.budget = 'Anggaran harus berupa angka lebih besar dari 0'
    } else if (budgetNum < 1000000) {
      newErrors.budget = 'Minimal anggaran adalah Rp 1.000.000'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { error } = await supabase.from('csr_programs').insert({
        company_name: companyName.trim(),
        budget_rupiah: budgetNum,
        tasks_funded: 0,
      })

      if (error) throw error

      // Reset form
      setCompanyName('')
      setBudget('')
      setIsFormOpen(false)

      // Invalidate routing query to trigger reload
      router.invalidate()
    } catch (err: any) {
      console.error('Error inserting program:', err)
      setSubmitError(
        err.message || 'Gagal menyimpan program. Silakan coba lagi.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  } as const

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary selection:text-white">
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logojalan-transparant.png" alt="Jalan Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight text-primary">
                Jalan Corporate
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Dashboard CSR
              </h1>
              <p className="text-slate-500 mt-1">
                Pantau alokasi dana dan program relawan yang sedang berjalan.
              </p>
            </div>
            <button
              onClick={handleTriggerAutomation}
              disabled={isSimulating}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer w-fit"
            >
              {isSimulating ? (
                <span>Memproses Simulasi...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Simulasi Webhook Otomasi</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="flex items-center gap-3 text-primary">
                  <Wallet className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Total Anggaran CSR</h3>
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(totalBudgetAllocated)}
                </p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="flex items-center text-emerald-600">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Terupdate
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Target className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Tugas Terdanai</h3>
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {totalFundedTasks}
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  Total inisiatif yang didukung
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="flex items-center gap-3 text-amber-600">
                  <Activity className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Program Perusahaan</h3>
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {activeProgramsCount}
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  Sedang berjalan saat ini
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
              <div className="relative h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-100">
                    Buat Inisiatif
                  </h3>
                  <p className="mt-2 text-sm text-blue-50">
                    Dukung lebih banyak relawan di lapangan.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-md transition-colors hover:bg-white/30 cursor-pointer"
                >
                  + Program Baru
                </button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left/Middle Columns: Activity Log */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="text-base font-semibold text-slate-900">
                  Log Aktivitas Relawan (Warga)
                </h3>
              </div>
              <div className="px-6 py-5">
                {tasks.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between py-4"
                      >
                        <div className="flex items-center gap-4">
                          {task.photo_url ? (
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              <img
                                src={task.photo_url}
                                alt="Task proof"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              <Target className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-slate-900 text-sm sm:text-base">
                              {task.users?.email || 'Relawan Anonim'}
                            </span>
                            <span className="text-sm text-slate-500">
                              {task.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              task.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                : task.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                                  : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                            }`}
                          >
                            {task.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(task.created_at).toLocaleDateString(
                              'id-ID',
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Activity className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      Belum ada aktivitas
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Belum ada warga yang melaporkan tugas untuk program Anda.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right Column: Programs List */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="border-b border-slate-200 px-6 py-5 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Daftar Program
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {programs.length} Total
                </span>
              </div>
              <div className="px-6 py-5">
                {programs.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {programs.map((program) => (
                      <li
                        key={program.id}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {program.company_name}
                          </span>
                          <span className="font-semibold text-primary text-sm">
                            {formatCurrency(program.budget_rupiah)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{program.tasks_funded} Tugas didanai</span>
                          <span>
                            {new Date(program.created_at).toLocaleDateString(
                              'id-ID',
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500">
                    Belum ada program terdaftar.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Modal Program Baru */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-xl border border-slate-100"
            >
              <button
                onClick={() => {
                  setIsFormOpen(false)
                  setErrors({})
                  setSubmitError('')
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Program CSR Baru
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Daftarkan inisiatif CSR baru untuk mendanai relawan.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Nama Perusahaan / Program
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. PT Garuda Nusantara"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Alokasi Anggaran (Rupiah)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 50000000"
                      className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                  {errors.budget && (
                    <p className="mt-1 text-xs text-red-600">{errors.budget}</p>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-opacity cursor-pointer mt-2"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Daftarkan Program'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
