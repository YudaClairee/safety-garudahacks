import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  Coins,
  Building,
  Users,
} from 'lucide-react'
import { Button } from '../components/ui/button'

gsap.registerPlugin(ScrollTrigger)

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // 1. Hero Reveal Animation
      const heroTl = gsap.timeline()
      heroTl.from('.hero-title-part', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out',
      })
      heroTl.from(
        '.hero-sub',
        {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.6',
      )
      heroTl.from(
        '.hero-ctas',
        {
          opacity: 0,
          y: 15,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4',
      )

      // 2. Bento Card Reveal
      gsap.from('.bento-card', {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.bento-section',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // 3. GSAP Card Reveal (Golden Flow)
      const cards = gsap.utils.toArray<HTMLElement>('.stack-card')
      cards.forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      })

      // 4. CTA and Footer fade-in
      gsap.from('.cta-box', {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 75%',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 overflow-x-hidden"
    >
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 tracking-tight">
            <img
              src="/logojalan-transparant.png"
              alt="Jalan Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-sky-900 dark:text-sky-400">
                Jalan
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Jaringan Relawan
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-650 dark:text-slate-350">
            <a
              href="#kebaikan"
              className="hover:text-sky-900 dark:hover:text-sky-400 transition-colors"
            >
              Program
            </a>
            <a
              href="#alir-kerja"
              className="hover:text-sky-900 dark:hover:text-sky-400 transition-colors"
            >
              Cara Kerja
            </a>
            <a
              href="#sponsor"
              className="hover:text-sky-900 dark:hover:text-sky-400 transition-colors"
            >
              Kemitraan
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-24 md:py-36 px-6 overflow-hidden">
        {/* Ambient Gradient */}
        <div className="absolute top-0 -z-10 h-[600px] w-full bg-[radial-gradient(120%_120%_at_50%_10%,var(--color-slate-50)_40%,oklch(0.9_0.08_250)_100%)] dark:bg-[radial-gradient(120%_120%_at_50%_10%,var(--color-slate-950)_40%,oklch(0.2_0.08_250)_100%)] opacity-70" />

        <div className="mx-auto max-w-6xl w-full text-center">
          <div className="hero-title-part mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-900/10 bg-sky-900/5 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
              Era Baru Aksi Sosial Transparan
            </span>
          </div>

          <h1 className="hero-title-part text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white leading-[1.1] max-w-5xl mx-auto">
            Aksi Sosial Warga, Didanai Langsung{' '}
            <span
              className="inline-block w-16 h-8 md:w-24 md:h-10 rounded-full align-middle bg-cover bg-center mx-1.5 border border-sky-900/20 shadow-sm"
              style={{
                backgroundImage:
                  'url(https://picsum.photos/seed/community/200/100)',
              }}
            ></span>{' '}
            oleh CSR.
          </h1>

          <p className="hero-sub mt-8 text-base md:text-lg text-slate-600 dark:text-slate-350 max-w-[65ch] mx-auto leading-relaxed">
            Menghubungkan inisiatif kepedulian warga dengan anggaran CSR
            perusahaan secara langsung, transparan, dan otomatis.
          </p>

          <div className="hero-ctas mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button
                size="lg"
                className="h-11 px-6 rounded-md bg-sky-900 text-white font-semibold hover:bg-sky-850 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 shadow-md transition-all"
              >
                Gabung Relawan
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 rounded-md border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
              >
                Kemitraan Perusahaan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Infinite Logo Marquee */}
      {/* Infinite Logo Marquee */}
      <section className="border-y border-slate-200 bg-slate-100/50 py-10 dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6">
            Pilar Fokus & Kategori Aksi Sponsor CSR Potensial
          </p>
          <div className="relative w-full overflow-hidden flex items-center">
            {/* Logo scroll track */}
            <div className="flex w-[200%] gap-12 animate-marquee shrink-0 items-center justify-around">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <ShieldCheck className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PELESTARIAN LINGKUNGAN
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Users className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PEMBERDAYAAN MASYARAKAT
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Sparkles className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PENDIDIKAN SOSIAL ANAK
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Building className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                BANTUAN FASILITAS UMUM
              </div>
              {/* Duplicate track for loop */}
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <ShieldCheck className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PELESTARIAN LINGKUNGAN
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Users className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PEMBERDAYAAN MASYARAKAT
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Sparkles className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                PENDIDIKAN SOSIAL ANAK
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">
                <Building className="h-5 w-5 text-sky-900 dark:text-sky-400" />
                BANTUAN FASILITAS UMUM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="kebaikan" className="bento-section py-32 md:py-48 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Mengapa Berjejaring Melalui Jalan?
            </h2>
            <p className="mt-4 text-base text-slate-650 dark:text-slate-350 leading-relaxed">
              Sebuah platform yang menyelaraskan energi sosial dengan sumber
              daya corporate secara langsung.
            </p>
          </div>

          {/* Gapless Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[220px] auto-rows-auto md:grid-flow-dense">
            {/* Main high-density item */}
            <div className="bento-card md:col-span-2 md:row-span-2 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/5 to-transparent dark:from-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-900 text-white dark:bg-sky-500 dark:text-slate-950">
                <Users className="h-6 w-6" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Kekuatan Kolaborasi Komunitas
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-350 max-w-[50ch] leading-relaxed">
                  Platform kami dirancang untuk mendemokratisasi penyaluran dana
                  CSR. Warga dapat berinisiatif melakukan perbaikan fasilitas
                  umum, penanaman pohon, atau bimbingan belajar, dan mendapatkan
                  apresiasi yang sepadan.
                </p>
              </div>
            </div>

            {/* Small Feature Card: Verification */}
            <div className="bento-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sistem Validasi
                </span>
                <ShieldCheck className="h-4 w-4 text-sky-900 dark:text-sky-400" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Bukti Foto
                </span>
                <p className="mt-2 text-xs text-slate-655 dark:text-slate-350">
                  Setiap aksi warga wajib melampirkan foto bukti lokasi sebelum
                  disetujui.
                </p>
              </div>
            </div>

            {/* Another Small Feature Card: Webhook */}
            <div className="bento-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Alokasi Otomatis
                </span>
                <Clock className="h-4 w-4 text-sky-900 dark:text-sky-400" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Real-Time
                </span>
                <p className="mt-2 text-xs text-slate-655 dark:text-slate-350">
                  Webhook menyetujui tugas, memotong dana CSR & menambah poin
                  warga seketika.
                </p>
              </div>
            </div>

            {/* Wide secondary callout */}
            <div className="bento-card md:col-span-3 flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm relative overflow-hidden group gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-900/10 text-sky-900 dark:bg-sky-500/10 dark:text-sky-400 shrink-0">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Sistem Poin Kebaikan
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 max-w-[65ch] leading-relaxed">
                  Setiap jam pengerjaan tugas sosial warga dikonversi menjadi
                  Poin Kebaikan yang dapat ditukarkan dengan kebutuhan harian,
                  sementara perusahaan mendapatkan laporan dampak sosial yang
                  terverifikasi.
                </p>
              </div>
              <div className="shrink-0">
                <Link to="/login">
                  <Button
                    size="sm"
                    className="h-9 px-4 bg-sky-900 text-white dark:bg-sky-500 dark:text-slate-950 hover:bg-sky-850 dark:hover:bg-sky-400 text-xs font-semibold uppercase tracking-wider"
                  >
                    Pelajari Reward
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GSAP Sticky Stack Flow (Desire) */}
      <section
        id="alir-kerja"
        ref={stackRef}
        className="bg-slate-100 dark:bg-slate-900/40 py-24 md:py-36"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Bagaimana Alur Jalan Bekerja?
            </h2>
            <p className="mt-4 text-base text-slate-650 dark:text-slate-350 leading-relaxed">
              Alur kerja kolaboratif dari pengajuan laporan hingga pencairan
              dana otomatis.
            </p>
          </div>

          <div className="relative flex flex-col gap-12">
            {/* Card 1 */}
            <div className="stack-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 shadow-md flex flex-col md:flex-row gap-8 items-center justify-between min-h-[300px]">
              <div className="flex-1">
                <span className="text-sky-900 dark:text-sky-400 font-mono text-sm tracking-widest uppercase">
                  Langkah 01
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                  Warga Melapor Aksi Sosial
                </h3>
                <p className="text-slate-600 dark:text-slate-350 mt-4 text-sm leading-relaxed">
                  Relawan memilih program aktif dari sponsor CSR, melakukan aksi
                  nyata di lapangan (seperti penanaman bibit atau pembersihan
                  selokan), lalu mengunggah foto bukti beserta jumlah jam yang
                  dihabiskan.
                </p>
              </div>
              <div
                className="w-full md:w-80 h-48 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-850 shadow-inner"
                style={{
                  backgroundImage:
                    'url(https://picsum.photos/seed/report/400/300)',
                }}
              />
            </div>

            {/* Card 2 */}
            <div className="stack-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 shadow-md flex flex-col md:flex-row gap-8 items-center justify-between min-h-[300px]">
              <div className="flex-1">
                <span className="text-sky-900 dark:text-sky-400 font-mono text-sm tracking-widest uppercase">
                  Langkah 02
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                  Validasi & Otomasi Webhook
                </h3>
                <p className="text-slate-600 dark:text-slate-350 mt-4 text-sm leading-relaxed">
                  Sistem melakukan pemrosesan otomatis terhadap data laporan.
                  Status laporan diverifikasi untuk mendeteksi koordinat foto
                  dan keaslian aktivitas.
                </p>
              </div>
              <div
                className="w-full md:w-80 h-48 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-850 shadow-inner"
                style={{
                  backgroundImage:
                    'url(https://picsum.photos/seed/validate/400/300)',
                }}
              />
            </div>

            {/* Card 3 */}
            <div className="stack-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 shadow-md flex flex-col md:flex-row gap-8 items-center justify-between min-h-[300px]">
              <div className="flex-1">
                <span className="text-sky-900 dark:text-sky-400 font-mono text-sm tracking-widest uppercase">
                  Langkah 03
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                  Klaim Poin & Penyaluran CSR
                </h3>
                <p className="text-slate-600 dark:text-slate-350 mt-4 text-sm leading-relaxed">
                  Setelah disetujui, Poin Kebaikan langsung masuk ke dompet
                  digital relawan. Secara bersamaan, dana program CSR berkurang
                  dan dilaporkan secara real-time ke dasbor perusahaan sponsor.
                </p>
              </div>
              <div
                className="w-full md:w-80 h-48 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-850 shadow-inner"
                style={{
                  backgroundImage:
                    'url(https://picsum.photos/seed/disburse/400/300)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Action / Call to Action Section (Action) */}
      <section
        id="sponsor"
        className="cta-section py-32 md:py-48 px-6 text-center"
      >
        <div className="mx-auto max-w-5xl">
          <div className="cta-box bg-sky-900 text-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-3xl p-12 md:p-20 shadow-xl relative overflow-hidden">
            {/* Subtle background graphics */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight">
                Siap Berkontribusi pada Perubahan?
              </h2>
              <p className="mt-6 text-base md:text-lg text-sky-100/80 dark:text-slate-350 max-w-[60ch] mx-auto leading-relaxed">
                Jadilah bagian dari relawan yang aktif melakukan aksi nyata,
                atau daftarkan perusahaan Anda sebagai penyalur dana CSR
                berdampak.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="h-12 px-8 bg-white text-sky-950 font-semibold hover:bg-slate-100 hover:text-sky-900 shadow-md"
                  >
                    Gabung Relawan
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 border-white/20 bg-sky-950/20 text-white hover:bg-sky-950/40 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
                  >
                    Hubungi Kemitraan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logojalan-transparant.png"
              alt="Jalan Logo"
              className="h-9 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight text-left">
              <span className="font-bold text-base text-slate-850 dark:text-white">
                Jalan
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wide">
                Jaringan Relawan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <a
              href="#kebaikan"
              className="hover:text-slate-650 dark:hover:text-slate-300"
            >
              Program
            </a>
            <a
              href="#alir-kerja"
              className="hover:text-slate-650 dark:hover:text-slate-300"
            >
              Cara Kerja
            </a>
            <a
              href="#sponsor"
              className="hover:text-slate-650 dark:hover:text-slate-300"
            >
              Mitra
            </a>
            <Link
              to="/login"
              className="hover:text-slate-650 dark:hover:text-slate-300"
            >
              Portal Relawan
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            &copy; 2026 Jalan. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
