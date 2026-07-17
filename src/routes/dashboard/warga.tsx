import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LogOut, Gift, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { getTaskCategory, taskCategories } from '@/lib/task-categories'
import { Button } from '@/components/ui/button'

type TaskStatus = 'Pending' | 'Approved'

type TaskReport = {
  id: string
  category: string
  status: TaskStatus
  createdAt: string
  photoUrl: string
  companyName: string
  location?: string
  description?: string
}

export const Route = createFileRoute('/dashboard/warga')({
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { points: 0, history: [], activePrograms: [] }

    const { data: user } = await supabase
      .from('users')
      .select('points')
      .eq('id', session.user.id)
      .single()
    
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, type, status, created_at, photo_url, company_name, location, description')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const { data: activeProgramsData } = await supabase
      .from('csr_programs')
      .select('id, company_name, focus_category, budget_rupiah, location')
      .gt('budget_rupiah', 0)
      .order('created_at', { ascending: false })

    return {
      points: user?.points || 0,
      history: (tasks || []).map(t => ({
        id: t.id,
        category: t.type,
        status: t.status === 'approved' ? 'Approved' : 'Pending',
        photoUrl: t.photo_url || '',
        companyName: t.company_name || '',
        location: t.location || '',
        description: t.description || '',
        createdAt: new Date(t.created_at).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
      })) as TaskReport[],
      activePrograms: (activeProgramsData || []) as any[]
    }
  },
  component: WargaRoute
})

const rewards = [
  {
    id: '1',
    name: 'Voucher Paket Sembako',
    cost: 12000,
    provider: 'Kebutuhan Pangan',
    description: 'Dukungan kebutuhan pangan pokok untuk rumah tangga yang membutuhkan.',
  },
  {
    id: '2',
    name: 'Token Listrik & BPJS Kesehatan',
    cost: 18000,
    provider: 'Utilitas & Proteksi Dasar',
    description: 'Bantuan tagihan dasar dan perlindungan kesehatan agar beban darurat lebih ringan.',
  },
  {
    id: '3',
    name: 'Cash Out E-Wallet (DANA / OVO / GoPay)',
    cost: 25000,
    provider: 'Dompet Digital',
    description: 'Pencairan fleksibel untuk kebutuhan mendesak via dompet digital pilihan Anda.',
  },
]

function WargaRoute() {
  const { points, history: initialHistory, activePrograms } = Route.useLoaderData()
  const router = useRouter()
  
  const [selectedProgramId, setSelectedProgramId] = useState('general')
  const [category, setCategory] = useState(taskCategories[0])
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reward Store states
  const [isRewardOpen, setIsRewardOpen] = useState(false)
  const [successClaim, setSuccessClaim] = useState<string | null>(null)

  function handleProgramChange(id: string) {
    setSelectedProgramId(id)
    if (id !== 'general') {
      const prog = activePrograms.find(p => p.id === id)
      if (prog) {
        if (prog.focus_category) setCategory(prog.focus_category)
        if (prog.location) setLocation(prog.location)
      }
    } else {
      setLocation('')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.navigate({ to: '/login' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!photo) {
      setError('Silakan pilih foto tugas sebelum mengirim laporan.')
      return
    }

    if (!location.trim()) {
      setError('Silakan isi lokasi spesifik aksi sosial.')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Anda belum login.')

      const filePath = `tasks/${Date.now()}_${photo.name}`
      const { error: uploadError, data } = await supabase.storage
        .from('task_photos')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('task_photos')
        .getPublicUrl(data.path)

      let finalCompanyName = ''
      if (selectedProgramId !== 'general') {
        const prog = activePrograms.find(p => p.id === selectedProgramId)
        if (prog) finalCompanyName = prog.company_name
      }

      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          type: category,
          status: 'pending',
          photo_url: publicUrlData.publicUrl,
          company_name: finalCompanyName,
          location: location.trim(),
          description: description.trim(),
        })
      
      if (insertError) throw insertError

      const selectedCategory = getTaskCategory(category)
      setMessage(
        `Laporan untuk kategori "${selectedCategory?.label ?? category}" telah berhasil dikirim.`,
      )
      setPhoto(null)
      setPhotoPreview(null)
      setLocation('')
      setDescription('')
      setSelectedProgramId('general')
      setCategory(taskCategories[0].value)
      
      // Invalidate to refresh loader data
      router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengirim laporan tugas.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPhoto(file)
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    } else {
      setPhotoPreview(null)
    }
  }

  function handleClaimReward(rewardName: string, cost: number) {
    if (points < cost) {
      alert('Saldo Safety Net Anda tidak cukup untuk menukarkan opsi ini.')
      return
    }
    setSuccessClaim(`Selamat! Anda telah sukses menukarkan ${cost.toLocaleString('id-ID')} poin Safety Net untuk "${rewardName}". Kode e-voucher akan dikirim ke email Anda.`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logojalan-transparant.png" alt="Jalan Logo" className="h-10 w-auto object-contain" />
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight text-primary">
                  Jalan Warga
                </span>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Cash-for-Work Safety Net
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-650">
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Saldo Warga</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Saldo Safety Net</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Ini adalah saldo Safety Net Anda yang dikumpulkan dari verifikasi kontribusi aksi relawan Anda.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-primary px-6 py-5 text-white shadow-xl shadow-primary/20 sm:min-w-48 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/80">Total Safety Net</p>
                  <p className="mt-2 text-4xl font-bold leading-none">{points.toLocaleString('id-ID')}</p>
                </div>
                <button 
                  onClick={() => {
                    setSuccessClaim(null)
                    setIsRewardOpen(true)
                  }}
                  className="mt-4 flex w-full justify-center items-center gap-2 bg-white/20 hover:bg-white/30 text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  <Gift className="h-3.5 w-3.5" />
                  Tukar Safety Net
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Form Lapor Tugas</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pilih sponsor CSR program atau kirimkan laporan umum untuk dicocokkan otomatis.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="program" className="block text-sm font-medium text-slate-700">
                  Pilih Sponsor Program CSR
                </label>
                <select
                  id="program"
                  value={selectedProgramId}
                  onChange={(event) => handleProgramChange(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="general">Cocokkan Otomatis (Pooled Funding)</option>
                  {activePrograms.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.company_name} (Fokus: {prog.focus_category} | Lokasi: {prog.location || 'Semua Wilayah'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-foreground">
                  Kategori Tugas
                </label>
                <div className="grid gap-3">
                  {taskCategories.map((item) => {
                    const isSelected = category === item.value
                    const isDisabled = selectedProgramId !== 'general'

                    return (
                      <button
                        key={item.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setCategory(item.value)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-slate-50'
                        } ${
                          isDisabled ? 'cursor-not-allowed opacity-60 hover:bg-background' : ''
                        }`}
                        aria-pressed={isSelected}
                        aria-disabled={isDisabled}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {item.label}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <div
                            className={`mt-1 h-4 w-4 rounded-full border-2 ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-slate-300 bg-white'
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
                {selectedProgramId !== 'general' && (
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    *Kategori dikunci secara otomatis sesuai fokus CSR sponsor yang Anda pilih.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                    Lokasi Spesifik Aksi
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    disabled={selectedProgramId !== 'general'}
                    placeholder="e.g. Jalan Dago RT 03 / Taman Hutan Kota"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background disabled:bg-slate-100 disabled:text-slate-550 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {selectedProgramId !== 'general' && (
                    <p className="text-[10px] text-slate-500 italic mt-1">
                      *Lokasi dikunci secara otomatis sesuai target wilayah sponsor.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                    Deskripsi Singkat Kegiatan
                  </label>
                  <input
                    id="description"
                    type="text"
                    placeholder="e.g. Menyapu tumpukan sampah plastik yang menyumbat air"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="photo" className="block text-sm font-medium text-foreground">
                  Unggah Bukti Foto Aksi
                </label>
                <div className="flex flex-col gap-4">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {photoPreview && (
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 aspect-video">
                      <img src={photoPreview} alt="Selected proof preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null)
                          setPhotoPreview(null)
                        }}
                        className="absolute top-2 right-2 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full p-1.5 transition cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {message}
                </div>
              ) : null}

              <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
                {loading ? 'Mengunggah Laporan...' : 'Kirim Laporan Tugas'}
              </Button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Riwayat Tugas Relawan</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status Laporan</p>
            </div>

            <div className="mt-6 space-y-4">
              {initialHistory.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl">
                  <div className="flex justify-center mb-3">
                    <ImageIcon className="h-10 w-10 text-slate-355" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Belum ada riwayat tugas.</p>
                  <p className="text-xs text-slate-400 mt-1">Unggah aksi pertamamu menggunakan formulir di atas!</p>
                </div>
              ) : (
                initialHistory.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {task.photoUrl ? (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-inner">
                          <img src={task.photoUrl} alt="Bukti Foto" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                          <ImageIcon className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{task.category}</p>
                        {task.companyName && (
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            Didanai: {task.companyName}
                          </p>
                        )}
                        {task.location && (
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Lokasi: {task.location}
                          </p>
                        )}
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">
                            "{task.description}"
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{task.createdAt}</p>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            task.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Active CSR Sponsors */}
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sponsor CSR Aktif
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Pendanaan aksi warga terbuka</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Perusahaan-perusahaan berikut sedang mendanai aksi sosial warga. Pastikan aksimu sesuai dengan kategori fokus mereka!
            </p>

            <div className="mt-6 space-y-4">
              {activePrograms.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Belum ada sponsor CSR aktif.</p>
                </div>
              ) : (
                activePrograms.map((program) => (
                  <div 
                    key={program.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {program.company_name}
                      </span>
                      {program.focus_category && (
                        <span className="text-[10px] text-primary font-bold mt-1 inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Fokus: {program.focus_category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-100/50 pt-2">
                      <span className="text-slate-400">Status Pendanaan:</span>
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Aktif</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>

      {/* Rewards Store Modal */}
      {isRewardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 shadow-xl border border-slate-150 flex flex-col max-h-[85vh]">
            <button
              onClick={() => setIsRewardOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Tukar Safety Net
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gunakan saldo Safety Net hasil kerja sosial Anda untuk menukarkan opsi di bawah.
            </p>
            <div className="mt-2 text-xs font-medium text-slate-700">
              Saldo Safety Net Saat Ini: <span className="text-primary font-bold">{points.toLocaleString('id-ID')} Safety Net</span>
            </div>

            {successClaim ? (
              <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <p className="font-semibold text-base">Penukaran Berhasil!</p>
                <p className="text-xs leading-relaxed">{successClaim}</p>
                <button
                  onClick={() => setSuccessClaim(null)}
                  className="mt-2 text-xs font-semibold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                >
                  Tukar Lagi
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3 overflow-y-auto pr-1 flex-1">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{reward.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{reward.provider}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-5">{reward.description}</p>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <span className="text-sm font-semibold text-primary">{reward.cost.toLocaleString('id-ID')} Safety Net</span>
                      <button
                        onClick={() => handleClaimReward(reward.name, reward.cost)}
                        disabled={points < reward.cost}
                        className={`text-xs font-semibold py-2 px-4 rounded-xl transition cursor-pointer ${
                          points >= reward.cost
                            ? 'bg-primary text-white hover:opacity-90'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Ambil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
