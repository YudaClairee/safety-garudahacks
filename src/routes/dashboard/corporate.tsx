import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CSRProgram } from '../../lib/types'
import { csrRewardOptions } from '../../lib/csr-reward-options'
import { getTaskCategory, taskCategories } from '../../lib/task-categories'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Target,
  Activity,
  ArrowUpRight,
  LogOut,
  X,
  Sparkles,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/corporate')({
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { programs: [], tasks: [] }

    const { data: programsData, error: programsError } = await supabase
      .from('csr_programs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, type, status, photo_url, created_at, location, description, user_id, users(email)')
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

  async function handleDeleteProgram(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus program CSR ini?')) return
    try {
      const { error } = await supabase
        .from('csr_programs')
        .delete()
        .eq('id', id)
      if (error) throw error
      router.invalidate() // Reload data
    } catch (err) {
      alert(`Gagal menghapus program: ${err instanceof Error ? err.message : String(err)}`)
    }
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
  const [location, setLocation] = useState('')
  const [rewardType, setRewardType] = useState(csrRewardOptions[0].value)
  const [rewardValue, setRewardValue] = useState('50000')
  const [focusCategory, setFocusCategory] = useState(taskCategories[0].value)
  const [errors, setErrors] = useState<{
    companyName?: string
    budget?: string
    location?: string
    rewardValue?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [previewTask, setPreviewTask] = useState<any | null>(null)

  async function handleVerifyTask(task: any, status: 'approved' | 'rejected') {
    setIsVerifying(task.id)
    try {
      if (status === 'rejected') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'rejected' })
          .eq('id', task.id)
        if (error) throw error
        alert('Tugas berhasil ditolak.')
        router.invalidate()
        return
      }

      // If approved:
      // 1. Fetch user's current points
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('points')
        .eq('id', task.user_id)
        .single()
      if (userFetchError) throw new Error(`Gagal mengambil data relawan: ${userFetchError.message}`)

      // 2. Fetch the company owner's programs
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesi login tidak valid')

      // Find programs that belong to the current company user
      const { data: programsData, error: programFetchError } = await supabase
        .from('csr_programs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('focus_category', task.type)
        .gte('budget_rupiah', 250000)
        .order('created_at', { ascending: true })
        .limit(1)

      let targetProgram: any = null

      if (programFetchError || !programsData || programsData.length === 0) {
        // Fallback: search for any program of this company with enough budget
        const { data: fallbackPrograms } = await supabase
          .from('csr_programs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('budget_rupiah', 250000)
          .order('created_at', { ascending: true })
          .limit(1)

        if (!fallbackPrograms || fallbackPrograms.length === 0) {
          throw new Error('Anda tidak memiliki program CSR aktif dengan sisa anggaran mencukupi (Min Rp 250.000) untuk mendanai tugas ini.')
        }
        targetProgram = fallbackPrograms[0]
      } else {
        targetProgram = programsData[0]
      }

      const newBudget = Number(targetProgram.budget_rupiah) - 250000
      const newTasksFunded = (targetProgram.tasks_funded || 0) + 1
      const rewardPointsAwarded =
        targetProgram.reward_type === 'Safety Credits/Poin'
          ? Number(targetProgram.reward_value) || Number(targetProgram.reward_points) || 1000
          : Number(targetProgram.reward_points) || 1000
      const newPoints = (userData?.points || 0) + rewardPointsAwarded

      // 3. Update Database (User Points, CSR Program, and Task Status)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', task.user_id)
      if (userUpdateError) throw new Error(`Gagal memperbarui poin warga: ${userUpdateError.message}`)

      const { error: programUpdateError } = await supabase
        .from('csr_programs')
        .update({
          budget_rupiah: newBudget,
          tasks_funded: newTasksFunded
        })
        .eq('id', targetProgram.id)
      if (programUpdateError) throw new Error(`Gagal memotong anggaran CSR: ${programUpdateError.message}`)

      const { error: taskUpdateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'approved',
          company_name: targetProgram.company_name,
          reward_type: targetProgram.reward_type,
          reward_value: targetProgram.reward_value,
        })
        .eq('id', task.id)
      if (taskUpdateError) throw new Error(`Gagal memperbarui status tugas: ${taskUpdateError.message}`)

      alert(`Tugas sukses disetujui! Didanai oleh "${targetProgram.company_name}". Relawan mendapat ${rewardPointsAwarded.toLocaleString('id-ID')} poin.`)
      router.invalidate()
    } catch (err: any) {
      alert(`Gagal memproses verifikasi: ${err.message || String(err)}`)
    } finally {
      setIsVerifying(null)
    }
  }

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

    if (!location.trim()) {
      newErrors.location = 'Lokasi target program wajib diisi'
    }

    const budgetNum = Number(budget)
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      newErrors.budget = 'Anggaran harus berupa angka lebih besar dari 0'
    } else if (budgetNum < 1000000) {
      newErrors.budget = 'Minimal anggaran adalah Rp 1.000.000'
    }

    const rewardValueNum = Number(rewardValue)
    if (!rewardValue || isNaN(rewardValueNum) || rewardValueNum <= 0) {
      newErrors.rewardValue = 'Reward value harus berupa angka lebih besar dari 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesi login tidak valid')

      const { error } = await supabase.from('csr_programs').insert({
        company_name: companyName.trim(),
        budget_rupiah: budgetNum,
        tasks_funded: 0,
        focus_category: focusCategory,
        location: location.trim(),
        reward_type: rewardType,
        reward_value: rewardValueNum,
        reward_points: rewardType === 'Safety Credits/Poin' ? rewardValueNum : 1000,
        user_id: session.user.id,
      })

      if (error) throw error

      // Reset form
      setCompanyName('')
      setBudget('')
      setLocation('')
      setRewardType(csrRewardOptions[0].value)
      setRewardValue('50000')
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
                            <button
                              onClick={() => setPreviewTask(task)}
                              className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 cursor-zoom-in hover:opacity-80 transition-opacity"
                              title="Klik untuk memperbesar bukti foto"
                            >
                              <img
                                src={task.photo_url}
                                alt="Task proof"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              <Target className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-slate-900 text-sm sm:text-base">
                              {task.users?.email || 'Relawan Anonim'}
                            </span>
                            <span className="text-sm text-slate-550 font-medium">
                              {getTaskCategory(task.type)?.label ?? task.type}
                            </span>
                            {task.location && (
                              <span className="text-xs text-slate-500 font-medium">
                                Lokasi: {task.location}
                              </span>
                            )}
                            {task.description && (
                              <span className="text-xs text-slate-400 italic">
                                "{task.description}"
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {task.status === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleVerifyTask(task, 'approved')}
                                  disabled={isVerifying === task.id}
                                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition duration-150 cursor-pointer disabled:opacity-50"
                                >
                                  Setuju
                                </button>
                                <button
                                  onClick={() => handleVerifyTask(task, 'rejected')}
                                  disabled={isVerifying === task.id}
                                  className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition duration-150 cursor-pointer disabled:opacity-50"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  task.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                    : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                                }`}
                              >
                                {task.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(task.created_at).toLocaleDateString('id-ID')}
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
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {program.company_name}
                            </span>
                            <div className="flex flex-col gap-0.5 mt-1">
                              {program.focus_category && (
                                <span className="text-[10px] text-primary font-semibold">
                                  Fokus: {program.focus_category}
                                </span>
                              )}
                              {program.location && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Lokasi Target: {program.location}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-medium">
                                Benefit: {program.reward_type || 'Voucher Paket Sembako'} (Rp {Number(program.reward_value || 0).toLocaleString('id-ID')})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary text-sm">
                              {formatCurrency(program.budget_rupiah)}
                            </span>
                            <button
                              onClick={() => handleDeleteProgram(program.id)}
                              className="text-slate-400 hover:text-red-550 cursor-pointer p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus Program"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{program.tasks_funded} Tugas didanai ({program.reward_points || 1000} Safety Credits)</span>
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
                    Fokus Kategori Aksi
                  </label>
                  <select
                    value={focusCategory}
                    onChange={(e) => setFocusCategory(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    {taskCategories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Lokasi Target Program CSR
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Taman Hutan Raya Dago / Kali Ciliwung RT 03"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.location}
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

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tipe Reward
                  </label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    {csrRewardOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Reward Value (Nominal)
                  </label>
                  <input
                    type="number"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(e.target.value)}
                    placeholder="e.g. 50000"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                  {errors.rewardValue && (
                    <p className="mt-1 text-xs text-red-600">{errors.rewardValue}</p>
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
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 transition-opacity cursor-pointer mt-2"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Daftarkan Program'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      {previewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col">
            <button
              onClick={() => setPreviewTask(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-955 pr-8 truncate">
              Bukti Aksi: {getTaskCategory(previewTask.type)?.label ?? previewTask.type}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Oleh: {previewTask.users?.email || 'Relawan Anonim'}
            </p>

            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-150 aspect-video max-h-[60vh] flex items-center justify-center bg-slate-950">
              <img 
                src={previewTask.photo_url} 
                alt="Aksi Relawan Full Resolution" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl">
              {previewTask.location && (
                <p>
                  <span className="font-bold text-slate-900">Lokasi:</span> {previewTask.location}
                </p>
              )}
              {previewTask.description && (
                <p>
                  <span className="font-bold text-slate-900">Deskripsi:</span> "{previewTask.description}"
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1 border-t border-slate-200/60 pt-2 flex items-center justify-between">
                <span>Tanggal Laporan: {new Date(previewTask.created_at).toLocaleString('id-ID')}</span>
                <span className="capitalize font-semibold text-primary">Status: {previewTask.status}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
