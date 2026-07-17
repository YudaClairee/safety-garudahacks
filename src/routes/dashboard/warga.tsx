import { useState, useRef, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LogOut, Gift, X, Image as ImageIcon, CheckCircle2, Camera, Compass, MapPin, RotateCw, Upload as UploadIcon } from 'lucide-react'

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
  rewardType?: string
  rewardValue?: number
  latitude?: number
  longitude?: number
  capturedAt?: string
}

type RedemptionRecord = {
  id: string
  rewardName: string
  rewardType: string
  rewardValue: number
  pointsCost: number
  voucherCode: string
  status: string
  createdAt: string
}

export const Route = createFileRoute('/dashboard/warga')({
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { points: 0, history: [], activePrograms: [], registrations: [], redemptions: [] }

    const { data: user } = await supabase
      .from('users')
      .select('points')
      .eq('id', session.user.id)
      .single()
    
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, type, status, created_at, photo_url, company_name, location, description, reward_type, reward_value, latitude, longitude, captured_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const { data: activeProgramsData } = await supabase
      .from('csr_programs')
      .select('id, company_name, focus_category, budget_rupiah, location, reward_type, reward_value, start_date, end_date')
      .gt('budget_rupiah', 0)
      .order('created_at', { ascending: false })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentUsersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const mitigationCategories = [
      'Membersihkan lingkungan',
      'Menanam pohon',
      'Mengelola sampah',
      'Mengajar anak-anak',
    ]

    const { count: mitigationSuccessCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id)
      .in('type', mitigationCategories)
      .eq('status', 'approved')

    const { data: redemptionsData } = await supabase
      .from('reward_redemptions')
      .select('id, reward_name, reward_type, reward_value, points_cost, voucher_code, status, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const { data: regsData } = await supabase
      .from('program_registrations')
      .select('program_id')
      .eq('user_id', session.user.id)

    const registrations = (regsData || []).map(r => r.program_id) as string[]

    const activePrograms = (activeProgramsData || []) as any[]

    function findProgramForTask(task: any) {
      if (task.company_name) {
        const byCompany = activePrograms.find((program) => program.company_name === task.company_name)
        if (byCompany) return byCompany
      }

      return activePrograms.find((program) => program.focus_category === task.type)
    }

    return {
      points: user?.points || 0,
      recentUsersCount: recentUsersCount ?? 0,
      mitigationSuccessCount: mitigationSuccessCount ?? 0,
      history: (tasks || []).map(t => {
        const matchedProgram = findProgramForTask(t)
        const rewardType = t.reward_type || matchedProgram?.reward_type || 'Menunggu program CSR'
        const rewardValue = Number(t.reward_value ?? matchedProgram?.reward_value ?? 0)

        return {
        id: t.id,
        category: t.type,
        status: t.status === 'approved' ? 'Approved' : 'Pending',
        photoUrl: t.photo_url || '',
        companyName: t.company_name || matchedProgram?.company_name || '',
        location: t.location || '',
        description: t.description || '',
        rewardType,
        rewardValue,
        latitude: t.latitude ? Number(t.latitude) : undefined,
        longitude: t.longitude ? Number(t.longitude) : undefined,
        capturedAt: t.captured_at ? new Date(t.captured_at).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : undefined,
        createdAt: new Date(t.created_at).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        }
      }) as TaskReport[],
      activePrograms,
      registrations,
      redemptions: (redemptionsData || []).map((item) => ({
        id: item.id,
        rewardName: item.reward_name,
        rewardType: item.reward_type,
        rewardValue: Number(item.reward_value || 0),
        pointsCost: Number(item.points_cost || 0),
        voucherCode: item.voucher_code,
        status: item.status,
        createdAt: new Date(item.created_at).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
      })) as RedemptionRecord[],
    }
  },
  component: WargaRoute
})

const rewards = [
  {
    id: '1',
    name: 'Voucher Paket Sembako',
    rewardType: 'Voucher Paket Sembako',
    cost: 12000,
    provider: 'Kebutuhan Pangan',
    description: 'Dukungan kebutuhan pangan pokok untuk rumah tangga yang membutuhkan.',
  },
  {
    id: '2',
    name: 'Token Listrik & BPJS Kesehatan',
    rewardType: 'Token Listrik PLN',
    cost: 18000,
    provider: 'Utilitas & Proteksi Dasar',
    description: 'Bantuan tagihan dasar dan perlindungan kesehatan agar beban darurat lebih ringan.',
  },
  {
    id: '3',
    name: 'Cash Out E-Wallet (DANA / OVO / GoPay)',
    rewardType: 'Transfer E-Wallet Darurat',
    cost: 25000,
    provider: 'Dompet Digital',
    description: 'Pencairan fleksibel untuk kebutuhan mendesak via dompet digital pilihan Anda.',
  },
]

const workAreas = ['Lingkungan', 'Sosial', 'Tata Kelola']

function WargaRoute() {
  const { points, history: initialHistory, activePrograms, redemptions, recentUsersCount, mitigationSuccessCount } = Route.useLoaderData()
  const router = useRouter()
  
  const [selectedProgramId, setSelectedProgramId] = useState('general')
  const [category, setCategory] = useState(taskCategories[0].value)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  const esgMetrics = [
    {
      label: 'Total Warga Terbaru',
      value: (recentUsersCount ?? 0).toLocaleString('id-ID'),
      description: 'Jumlah warga baru terdaftar dalam 30 hari terakhir.',
    },
    {
      label: 'Aksi Mitigasi Berhasil',
      value: (mitigationSuccessCount ?? 0).toString(),
      description: 'Jumlah aksi mitigasi dengan status terverifikasi berhasil.',
    },
    {
      label: 'Skor ESG',
      value: '91',
      description: 'Indikator keberlanjutan lingkungan, sosial, dan tata kelola dari aksi yang dijalankan.',
    },
  ]
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registeringId, setRegisteringId] = useState<string | null>(null)

  // Camera & Geolocation verification states
  const [proofMode, setProofMode] = useState<'camera' | 'upload'>('camera')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [capturedAt, setCapturedAt] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  async function startCameraAndLocation() {
    setCameraError(null)
    setLocationStatus('fetching')
    setError(null)
    setLatitude(null)
    setLongitude(null)

    // Request Location first or simultaneously
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
          setLocationStatus('success')
        },
        (err) => {
          console.error('Geolocation error:', err)
          setLocationStatus('error')
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    } else {
      setLocationStatus('error')
    }

    // Start video stream
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }

      // Request user camera (facingMode user for selfie)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      setCameraStream(stream)
      setIsCameraActive(true)

      // Use a timeout to let the video element mount/update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err: any) {
      console.error('Camera error:', err)
      setCameraError('Gagal mengakses kamera. Pastikan memberikan izin kamera di browser Anda.')
      setIsCameraActive(false)
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setIsCameraActive(false)
  }

  function handleCapture() {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Mirror snapshot because we scale video element
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setPhoto(file)
          setPhotoPreview(canvas.toDataURL('image/jpeg'))
          setCapturedAt(new Date().toISOString())
          stopCamera()
        }
      }, 'image/jpeg', 0.92)
    }
  }

  function handleRetake() {
    setPhoto(null)
    setPhotoPreview(null)
    setCapturedAt(null)
    startCameraAndLocation()
  }

  function handleModeChange(mode: 'camera' | 'upload') {
    setProofMode(mode)
    if (mode === 'upload') {
      stopCamera()
      // Clear coordinate state to avoid posting false camera coordinates
      setLatitude(null)
      setLongitude(null)
      setCapturedAt(null)
    }
  }

  async function handleRegisterProgram(programId: string) {
    setRegisteringId(programId)
    setError(null)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Sesi login tidak ditemukan. Silakan login kembali.')
        return
      }

      const { error: regError } = await supabase
        .from('program_registrations')
        .insert({
          user_id: session.user.id,
          program_id: programId,
        })
      
      if (regError) throw regError

      alert('Berhasil mendaftar program CSR! Anda sekarang terdaftar untuk aksi ini.')
      router.invalidate()
    } catch (err: any) {
      alert(`Gagal mendaftar: ${err.message || String(err)}`)
    } finally {
      setRegisteringId(null)
    }
  }

  // Reward Store states
  const [isRewardOpen, setIsRewardOpen] = useState(false)
  const [successClaim, setSuccessClaim] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState<string | null>(null)

  const selectedProgram = activePrograms.find(p => p.id === selectedProgramId)
  const isGeneral = selectedProgramId === 'general'
  const isRegisteredForSelected = isGeneral ? true : registrations.includes(selectedProgramId)
  const selectedProgramHasStarted = isGeneral ? true : (selectedProgram?.start_date ? new Date() >= new Date(selectedProgram.start_date) : true)
  const selectedProgramHasEnded = isGeneral ? false : (selectedProgram?.end_date ? (() => {
    const d = new Date(selectedProgram.end_date)
    d.setHours(23, 59, 59, 999)
    return new Date() > d
  })() : false)
  
  // Platform Fee quota calculation
  const selectedProgramCost = selectedProgram ? Math.round(Number(selectedProgram.reward_value || 0) * 1.12) : 0
  const selectedProgramHasQuota = isGeneral ? true : (selectedProgram ? Number(selectedProgram.budget_rupiah) >= selectedProgramCost : false)
  
  const isFormBlocked = !isGeneral && (!isRegisteredForSelected || !selectedProgramHasStarted || selectedProgramHasEnded || !selectedProgramHasQuota)

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

    if (selectedProgramId !== 'general') {
      const prog = activePrograms.find(p => p.id === selectedProgramId)
      if (prog) {
        const isReg = registrations.includes(selectedProgramId)
        if (!isReg) {
          setError('Anda belum terdaftar untuk program ini. Silakan mendaftar terlebih dahulu.')
          return
        }

        const isBefore = prog.start_date ? new Date() < new Date(prog.start_date) : false
        if (isBefore) {
          setError(`Aksi program ini belum dimulai. Baru dimulai pada ${new Date(prog.start_date).toLocaleString('id-ID')}`)
          return
        }

        const isAfter = prog.end_date ? (() => {
          const d = new Date(prog.end_date)
          d.setHours(23, 59, 59, 999)
          return new Date() > d
        })() : false
        if (isAfter) {
          setError('Periode program CSR ini sudah berakhir.')
          return
        }

        const cost = Math.round(Number(prog.reward_value || 0) * 1.12)
        if (Number(prog.budget_rupiah) < cost) {
          setError('Kuota pendanaan program CSR ini sudah habis.')
          return
        }
      }
    }

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
      let finalRewardType = ''
      let finalRewardValue: number | null = null
      if (selectedProgramId !== 'general') {
        const prog = activePrograms.find(p => p.id === selectedProgramId)
        if (prog) {
          finalCompanyName = prog.company_name
          finalRewardType = prog.reward_type || ''
          finalRewardValue = Number(prog.reward_value) || null
        }
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
          reward_type: finalRewardType || null,
          reward_value: finalRewardValue,
          latitude: latitude || null,
          longitude: longitude || null,
          captured_at: capturedAt || null,
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

      // Reset Camera & GPS states
      setLatitude(null)
      setLongitude(null)
      setCapturedAt(null)
      stopCamera()
      
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

  async function handleClaimReward(rewardName: string, cost: number, rewardType: string) {
    if (points < cost) {
      alert('Saldo Safety Net Anda tidak cukup untuk menukarkan opsi ini.')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Sesi login tidak ditemukan. Silakan login kembali.')
        return
      }

      const res = await fetch('/api/redeem-reward', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rewardName,
          rewardType,
          rewardValue: cost,
          pointsCost: cost,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Redeem gagal diproses')
      }

      setVoucherCode(data.voucherCode)
      setSuccessClaim(
        `Selamat! Anda telah sukses menukarkan ${cost.toLocaleString('id-ID')} poin Safety Net untuk "${rewardName}".`,
      )
      router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Redeem gagal diproses')
    }
  }

  function handleExportEsgReport() {
    try {
      const reportHtml = `
        <html>
          <head>
            <title>Laporan ESG Jalan Warga</title>
            <style>
              body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #0f172a; }
              h1 { font-size: 24px; margin-bottom: 0.5rem; }
              h2 { font-size: 18px; margin-top: 1.5rem; margin-bottom: 0.5rem; }
              p, li { font-size: 12px; line-height: 1.5; }
              .metric { margin-bottom: 1rem; }
              .metric-label { font-weight: 700; }
              .metric-value { font-size: 18px; margin-top: 0.25rem; color: #0c4a6e; }
              .metric-desc { color: #475569; margin-top: 0.25rem; }
              .badge { display: inline-block; margin-right: 0.5rem; margin-bottom: 0.5rem; padding: 0.35rem 0.75rem; border-radius: 9999px; background: #bae6fd; color: #0c4a6e; font-size: 11px; }
            </style>
          </head>
          <body>
            <h1>Laporan ESG Jalan Warga</h1>
            <p>Tanggal: ${new Date().toLocaleString('id-ID')}</p>
            <p>Total Safety Net: ${points.toLocaleString('id-ID')}</p>
            <h2>Area Kerja</h2>
            <div>${workAreas.map((area) => `<span class="badge">${area}</span>`).join('')}</div>
            <h2>Metrik Keberlanjutan</h2>
            ${esgMetrics
              .map(
                (metric) => `
                  <div class="metric">
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-desc">${metric.description}</div>
                  </div>
                `,
              )
              .join('')}
            <h2>Ringkasan Tugas</h2>
            <p>Total laporan aksi: ${initialHistory.length}</p>
            <p style="margin-top:1rem; color:#475569; font-size:11px;">Dokumen ini berisi ringkasan metrik ESG dan dampak keberlanjutan yang terkait dengan aktivitas relawan Anda.</p>
          </body>
        </html>
      `

      const reportWindow = window.open('', '_blank', 'toolbar=no,scrollbars=yes,resizable=yes,width=800,height=900')
      if (!reportWindow) {
        throw new Error('Tidak dapat membuka jendela baru untuk mencetak laporan ESG.')
      }

      reportWindow.document.write(reportHtml)
      reportWindow.document.close()
      reportWindow.focus()
      reportWindow.print()
      reportWindow.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat PDF laporan ESG.')
    }
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
                    setVoucherCode(null)
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

          <section className="rounded-[2rem] border border-slate-200 bg-sky-50/95 p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-700/80">ESG & Safety Impact</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Metrik Keberlanjutan & Area Kerja</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  Ringkasan metrik dampak sosial, lingkungan, dan keselamatan untuk aksi relawan Anda.
                </p>
              </div>
              <div className="rounded-3xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-900">
                Area Kerja
                <div className="mt-3 flex flex-wrap gap-2">
                  {workAreas.map((area) => (
                    <span key={area} className="rounded-full bg-sky-200 px-3 py-1 text-xs font-medium text-sky-900">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {esgMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.75rem] border border-sky-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-sky-800">{metric.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{metric.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Voucher Saya</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Riwayat voucher internal yang sudah kamu klaim dari Safety Net.
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {redemptions.length} Klaim
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {redemptions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-slate-600">Belum ada voucher yang diklaim.</p>
                  <p className="mt-1 text-xs text-slate-400">Klaim benefit pertamamu dari modal Tukar Safety Net.</p>
                </div>
              ) : (
                redemptions.map((redeem) => (
                  <article
                    key={redeem.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{redeem.rewardName}</h3>
                        <p className="text-xs text-slate-500">
                          {redeem.rewardType} · Rp {redeem.rewardValue.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Kode Voucher: <span className="font-semibold tracking-wider text-slate-700">{redeem.voucherCode}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          {redeem.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {redeem.pointsCost.toLocaleString('id-ID')} Safety Net
                        </span>
                        <span className="text-[11px] text-slate-400">{redeem.createdAt}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-sky-50/90 p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-700/70">Widget ESG</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Metrik Safety Impact & ESG</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  Lihat ringkasan dampak keberlanjutan dan area kerja yang sedang difokuskan untuk setiap aksi sosial.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="rounded-3xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-900">
                  Area Kerja
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workAreas.map((area) => (
                      <span key={area} className="rounded-full bg-sky-200 px-3 py-1 text-xs font-medium text-sky-900">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleExportEsgReport}>
                  Export ESG Report
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {esgMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.75rem] border border-sky-200 bg-white/90 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-sky-800">{metric.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{metric.description}</p>
                </div>
              ))}
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
                  {activePrograms.map((prog) => {
                    const cost = Math.round(Number(prog.reward_value || 0) * 1.12)
                    const remaining = cost > 0 ? Math.floor(Number(prog.budget_rupiah) / cost) : 0
                    return (
                      <option key={prog.id} value={prog.id} disabled={remaining <= 0}>
                        {prog.company_name} (Fokus: {prog.focus_category} | Lokasi: {prog.location || 'Semua Wilayah'} | +{Number(prog.reward_value || 0).toLocaleString('id-ID')} Poin | Sisa Kuota: {remaining} slot)
                      </option>
                    )
                  })}
                </select>
              </div>

              {isFormBlocked ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 flex flex-col items-center text-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {!isRegisteredForSelected 
                        ? 'Pendaftaran Diperlukan' 
                        : selectedProgramHasEnded 
                          ? 'Program CSR Selesai' 
                          : !selectedProgramHasQuota 
                            ? 'Kuota Program Habis' 
                            : 'Aksi Belum Dimulai'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
                      {!isRegisteredForSelected
                        ? `Anda harus mendaftar sebagai relawan untuk program "${selectedProgram?.company_name}" terlebih dahulu sebelum dapat mengirimkan laporan tugas.`
                        : selectedProgramHasEnded
                          ? `Program "${selectedProgram?.company_name}" telah berakhir pada ${new Date(selectedProgram.end_date!).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}.`
                          : !selectedProgramHasQuota
                            ? `Program "${selectedProgram?.company_name}" telah kehabisan kuota pendanaan untuk saat ini.`
                            : `Program "${selectedProgram?.company_name}" baru akan dimulai pada tanggal ${new Date(selectedProgram.start_date!).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`}
                    </p>
                  </div>
                  
                  {!isRegisteredForSelected && !selectedProgramHasEnded && (
                    <Button
                      type="button"
                      onClick={() => handleRegisterProgram(selectedProgramId)}
                      disabled={registeringId === selectedProgramId}
                      className="mt-2 w-full max-w-[200px]"
                    >
                      {registeringId === selectedProgramId ? 'Mendaftar...' : 'Daftar Aksi Sekarang'}
                    </Button>
                  )}
                </div>
              ) : (
                <>
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
                    <label className="block text-sm font-medium text-foreground">
                      Kirim Bukti Aksi (Selfie & Lokasi)
                    </label>

                    {/* Mode Selector Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 max-w-xs">
                      <button
                        type="button"
                        onClick={() => handleModeChange('camera')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          proofMode === 'camera'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Kamera Selfie
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('upload')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          proofMode === 'upload'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <UploadIcon className="h-3.5 w-3.5" />
                        Unggah File
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      {proofMode === 'camera' ? (
                        <>
                          {photoPreview ? (
                            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 aspect-video">
                              <img src={photoPreview} alt="Bukti Selfie Terambil" className="w-full h-full object-cover scale-x-[-1]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setPhoto(null)
                                  setPhotoPreview(null)
                                  setCapturedAt(null)
                                }}
                                className="absolute top-2 right-2 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full p-1.5 transition cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {!isCameraActive ? (
                                <div className="border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center gap-3 text-center">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Camera className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-800">Verifikasi Kamera Selfie & GPS</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                      Sponsor mewajibkan relawan melakukan selfie di lokasi aksi untuk validasi langsung.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={startCameraAndLocation}
                                    className="mt-1 inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                                  >
                                    Aktifkan Kamera & GPS
                                  </button>
                                  {cameraError && (
                                    <p className="text-xs text-red-505 mt-1 font-medium bg-red-50 border border-red-100 rounded-lg py-1.5 px-3">
                                      {cameraError}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="relative w-full max-w-md mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-inner group">
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover scale-x-[-1]"
                                  />
                                  {/* Circular overlay for selfie framing */}
                                  <div className="absolute inset-0 border-[3px] border-dashed border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-[180px] h-[180px] border-2 border-white/60 rounded-full bg-transparent flex items-center justify-center">
                                      <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-medium tracking-wide">Posisikan Wajah</span>
                                    </div>
                                  </div>
                                  
                                  {/* Floating Location indicator */}
                                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white py-1.5 px-3 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1.5 shadow-sm">
                                    {locationStatus === 'fetching' ? (
                                      <>
                                        <RotateCw className="h-3 w-3 animate-spin text-amber-400" />
                                        <span>Mengunci GPS...</span>
                                      </>
                                    ) : locationStatus === 'success' ? (
                                      <>
                                        <MapPin className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                                        <span>GPS Terkunci</span>
                                      </>
                                    ) : (
                                      <>
                                        <Compass className="h-3 w-3 text-rose-455" />
                                        <span>GPS Gagal (Tetap Ambil Foto)</span>
                                      </>
                                    )}
                                  </div>

                                  {/* Shutter controls */}
                                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={stopCamera}
                                      className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold py-2 px-3 rounded-xl cursor-pointer transition-colors"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCapture}
                                      disabled={locationStatus === 'fetching'}
                                      className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 hover:border-primary flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                      title="Ambil Foto"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-red-650 hover:bg-red-500 transition-colors" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <>
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
                        </>
                      )}

                      {/* GPS & Timestamp verification display */}
                      {(latitude !== null || longitude !== null || capturedAt !== null) && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Metadata Keamanan Aksi</h5>
                            <div className="flex flex-col gap-1 mt-1.5 text-xs text-slate-655 font-medium">
                              {latitude !== null && longitude !== null ? (
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-primary" />
                                  <span>Koordinat: <span className="font-bold text-slate-800">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span></span>
                                </p>
                              ) : (
                                <p className="flex items-center gap-1.5 text-amber-600">
                                  <Compass className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Lokasi GPS tidak terdeteksi (Fallback Lokasi Manual)</span>
                                </p>
                              )}
                              {capturedAt && (
                                <p className="flex items-center gap-1.5">
                                  <RotateCw className="h-3.5 w-3.5 text-primary" />
                                  <span>Waktu Pengambilan: <span className="font-bold text-slate-800">{new Date(capturedAt).toLocaleString('id-ID')}</span></span>
                                </p>
                              )}
                            </div>
                          </div>
                          {proofMode === 'camera' && photoPreview && (
                            <button
                              type="button"
                              onClick={handleRetake}
                              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              Foto Ulang
                            </button>
                          )}
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
                </>
              )}
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
                        <div className="mt-1 inline-flex max-w-full items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          🎁 Benefit: {task.rewardType || 'Menunggu program CSR'}{task.rewardValue ? ` (${task.rewardType?.toLowerCase().includes('poin') || task.rewardType?.toLowerCase().includes('credit') ? '' : 'Rp '}${task.rewardValue.toLocaleString('id-ID')}${task.rewardType?.toLowerCase().includes('poin') || task.rewardType?.toLowerCase().includes('credit') ? ' Poin' : ''})` : ''}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Didanai langsung oleh {task.companyName || 'program CSR'} via Program CSR
                        </p>
                        {task.location && (
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Lokasi: {task.location}
                          </p>
                        )}
                        {task.latitude !== undefined && task.longitude !== undefined && (
                          <p className="text-[11px] text-slate-550 flex items-center gap-1 mt-0.5 font-medium">
                            <MapPin className="h-3 w-3 text-primary inline" />
                            <span>Koordinat: <a href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">{task.latitude.toFixed(5)}, {task.longitude.toFixed(5)}</a></span>
                          </p>
                        )}
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">
                            "{task.description}"
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2.5 pt-1.5 border-t border-slate-200/40">
                          <span className="text-[10px] text-slate-400">Dilaporkan: {task.createdAt}</span>
                          {task.capturedAt && (
                            <span className="text-[9px] text-slate-550 bg-slate-100 px-2 py-0.5 rounded-full font-medium inline-block w-fit">Waktu Foto: {task.capturedAt}</span>
                          )}
                        </div>
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
                activePrograms.map((program) => {
                  const isRegistered = registrations.includes(program.id)
                  const startDateObj = program.start_date ? new Date(program.start_date) : null
                  const endDateObj = program.end_date ? (() => {
                    const d = new Date(program.end_date)
                    d.setHours(23, 59, 59, 999)
                    return d
                  })() : null
                  const now = new Date()
                  
                  const isBeforeStart = startDateObj ? startDateObj > now : false
                  const isAfterEnd = endDateObj ? now > endDateObj : false
                  const isOngoing = !isBeforeStart && !isAfterEnd

                  const cost = Math.round(Number(program.reward_value || 0) * 1.12)
                  const remaining = cost > 0 ? Math.floor(Number(program.budget_rupiah) / cost) : 0
                  const total = remaining + (program.tasks_funded || 0)
                  const hasQuota = remaining > 0

                  const startDateStr = startDateObj ? startDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''
                  const endDateStr = endDateObj ? endDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
                  const periodStr = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : 'Tanpa batas waktu'

                  let statusText = 'Aktif'
                  let statusStyle = 'text-emerald-600 bg-emerald-50'
                  if (isAfterEnd) {
                    statusText = 'Selesai'
                    statusStyle = 'text-slate-500 bg-slate-100'
                  } else if (!hasQuota) {
                    statusText = 'Kuota Habis'
                    statusStyle = 'text-red-600 bg-red-50'
                  } else if (isBeforeStart) {
                    statusText = 'Pendaftaran'
                    statusStyle = 'text-blue-600 bg-blue-50'
                  } else if (isOngoing && startDateObj) {
                    statusText = 'Hari-H'
                    statusStyle = 'text-amber-600 bg-amber-50'
                  }

                  return (
                    <div 
                      key={program.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2.5"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {program.company_name}
                        </span>
                        <div className="flex flex-col gap-1 mt-1">
                          {program.focus_category && (
                            <span className="text-[10px] text-primary font-bold inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              Fokus: {program.focus_category}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">
                            📅 {periodStr}
                          </span>
                          <span className="text-[11px] text-amber-600 font-bold inline-flex items-center gap-1 mt-0.5">
                            🎁 +{Number(program.reward_value || 0).toLocaleString('id-ID')} Poin
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            🎟️ Kuota: {remaining} / {total} slot
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-slate-100/50 pt-2">
                        <span className="text-slate-400">Status Aksi:</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-md ${statusStyle}`}>{statusText}</span>
                      </div>
                      
                      {isRegistered ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold py-1.5 mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Anda Sudah Terdaftar</span>
                        </div>
                      ) : isAfterEnd ? (
                        <div className="text-center rounded-xl bg-slate-100 text-slate-500 text-[11px] font-semibold py-1.5 mt-1">
                          Periode Program Berakhir
                        </div>
                      ) : !hasQuota ? (
                        <div className="text-center rounded-xl bg-red-50 text-red-700 text-[11px] font-semibold py-1.5 mt-1 border border-red-100">
                          Kuota Pendanaan Habis
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRegisterProgram(program.id)}
                          disabled={registeringId === program.id}
                          type="button"
                          className="w-full mt-1 rounded-xl bg-primary text-xs font-semibold py-1.5 cursor-pointer text-white"
                        >
                          {registeringId === program.id ? 'Mendaftar...' : 'Daftar Aksi'}
                        </Button>
                      )}
                    </div>
                  )
                })
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
                {voucherCode && (
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-left text-xs font-medium text-emerald-900 ring-1 ring-inset ring-emerald-200">
                    Kode Voucher: <span className="font-bold tracking-wider">{voucherCode}</span>
                  </div>
                )}
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
                        onClick={() => handleClaimReward(reward.name, reward.cost, reward.rewardType)}
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
