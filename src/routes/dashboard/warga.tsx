import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/warga')({ component: WargaRoute })

const taskCategories = [
  'Membersihkan lingkungan',
  'Membantu tetangga lansia',
  'Menanam pohon',
  'Mengelola sampah',
  'Mengajar anak-anak',
  'Donasi makanan',
  'Kegiatan sosial lainnya',
]

type TaskStatus = 'Pending' | 'Approved'

type TaskReport = {
  id: string
  category: string
  note: string
  status: TaskStatus
  createdAt: string
}

function WargaRoute() {
  const [points] = useState(25000)
  const [category, setCategory] = useState(taskCategories[0])
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<TaskReport[]>([
    {
      id: '1',
      category: 'Membersihkan lingkungan',
      note: 'Mengumpulkan sampah plastik di area taman kota.',
      status: 'Approved',
      createdAt: '17 Jul 2026, 08:45',
    },
    {
      id: '2',
      category: 'Membantu tetangga lansia',
      note: 'Membelikan bahan makanan ke rumah Bu Rina.',
      status: 'Pending',
      createdAt: '17 Jul 2026, 14:10',
    },
  ])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!photo) {
      setError('Silakan pilih foto tugas sebelum mengirim laporan.')
      return
    }

    setLoading(true)

    try {
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

      setMessage(
        `Foto berhasil diunggah ke Supabase storage: ${data.path}. Laporan untuk kategori "${category}" telah dikirim.`
      )
      setHistory((current) => [
        {
          id: `${Date.now()}`,
          category,
          note,
          status: 'Pending',
          createdAt: new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...current,
      ])
      setPhoto(null)
      setNote('')
      setCategory(taskCategories[0])
      setExchangeMessage(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengunggah foto tugas.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPhoto(file)
  }

  function handleExchangePoints() {
    setExchangeMessage('Fitur Tukar Poin sementara aktif. Ini adalah tombol dummy untuk demonstrasi.')
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <section className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Saldo Warga</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Poin Kebaikan</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Ini adalah saldo poin kebaikan Anda yang dapat digunakan untuk melaporkan tugas dan mendapatkan penghargaan.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-primary px-6 py-5 text-white shadow-xl shadow-primary/20 sm:min-w-[12rem]">
              <p className="text-sm uppercase tracking-[0.28em] text-white/80">Total Poin</p>
              <p className="mt-4 text-4xl font-semibold leading-none">{points.toLocaleString('id-ID')}</p>
              <p className="mt-1 text-sm text-white/80">Poin Kebaikan</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Form Lapor Tugas</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pilih satu dari 7 kategori tugas berikut dan unggah bukti foto Tugas.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              7 kategori tersedia
            </span>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-foreground">
                Kategori Tugas
              </label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {taskCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="note" className="block text-sm font-medium text-foreground">
                Catatan singkat (opsional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Tambahkan detail tugas atau lokasi jika perlu"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="photo" className="block text-sm font-medium text-foreground">
                Unggah Foto Bukti Tugas
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {photo ? (
                <p className="text-sm text-muted-foreground">File terpilih: {photo.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Pilih foto tugas untuk diunggah ke Supabase storage.</p>
              )}
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Mengunggah...' : 'Kirim Laporan Tugas'}
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Tukar Poin</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Gunakan poin Anda untuk menukar rewards. Tombol di bawah ini hanya dummy dan tidak akan mengubah saldo.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={handleExchangePoints}>
              Tukar Poin
            </Button>
          </div>
          {exchangeMessage ? (
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {exchangeMessage}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-border bg-card/90 p-8 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Riwayat Tugas</h2>
            <p className="text-sm text-muted-foreground">Status pending / approved</p>
          </div>

          <div className="mt-6 space-y-4">
            {history.map((task) => (
              <article
                key={task.id}
                className="rounded-3xl border border-border bg-background/80 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.category}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{task.note}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        task.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status}
                    </span>
                    <span className="text-muted-foreground">{task.createdAt}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
