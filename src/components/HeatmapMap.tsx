import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

interface MapTask {
  id: string
  latitude: number
  longitude: number
  type: string
  status: string
  location?: string
  created_at: string
  company_name?: string
  description?: string
  photo_url?: string
}

interface HeatmapMapProps {
  mode: 'heatmap' | 'markers'
  tasks: MapTask[]
  height?: string
}

export default function HeatmapMap(props: HeatmapMapProps) {
  const [MapComponent, setMapComponent] = useState<ComponentType<any> | null>(
    null,
  )

  useEffect(() => {
    // Only import ClientMap on the client side to avoid window is not defined SSR issues
    import('./ClientMap')
      .then((mod) => {
        setMapComponent(() => mod.default)
      })
      .catch((err) => {
        console.error('Gagal memuat komponen peta Leaflet:', err)
      })
  }, [])

  if (!MapComponent) {
    return (
      <div
        style={{ height: props.height || '400px' }}
        className="w-full bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3"
      >
        <div className="h-7 w-7 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
        <span className="text-xs font-bold tracking-wide text-slate-400">
          Menyiapkan Visualisasi Peta...
        </span>
      </div>
    )
  }

  return <MapComponent {...props} />
}
