import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({ component: DashboardPage })

function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card/80 p-10 shadow-lg shadow-black/5 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Anda sudah masuk. Silakan tambahkan konten dashboard di sini.
        </p>
      </div>
    </main>
  )
}
