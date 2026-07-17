import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { getTaskCategory } from '../lib/task-categories'

// Fix default leaflet icons path issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom SVG Icons for modern aesthetic without external image loads
const createSvgIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" style="width: 28px; height: 28px; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      </div>
    `,
    className: 'custom-svg-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

const icons = {
  approved: createSvgIcon('#10b981'), // Emerald-500
  pending: createSvgIcon('#f59e0b'),  // Amber-500
  rejected: createSvgIcon('#ef4444'), // Red-500
  default: createSvgIcon('#3b82f6'),  // Blue-500
}

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

interface ClientMapProps {
  mode: 'heatmap' | 'markers'
  tasks: MapTask[]
  height?: string
}

// Sub-component to auto-fit bounds based on tasks coordinates
function AutoCenter({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates.length === 0) return
    if (coordinates.length === 1) {
      map.setView(coordinates[0], 13)
    } else {
      const bounds = L.latLngBounds(coordinates)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, coordinates])

  return null
}

// Sub-component to inject Leaflet.heat layer
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || points.length === 0) return

    const heatLayer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.4: '#3b82f6', // Biru (dingin)
        0.65: '#eab308', // Kuning (sedang)
        1.0: '#ef4444', // Merah (panas)
      }
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points])

  return null
}

export default function ClientMap({ mode, tasks, height = '400px' }: ClientMapProps) {
  const [showMarkersOnHeatmap, setShowMarkersOnHeatmap] = useState(true)

  // Filter tasks with valid GPS
  const validTasks = tasks.filter(t => t.latitude != null && t.longitude != null)
  
  // Format coordinates for Leaflet bounds [lat, lng]
  const coordinates: [number, number][] = validTasks.map(t => [Number(t.latitude), Number(t.longitude)])
  
  // Format points for heatmap [lat, lng, intensity]
  const heatPoints: [number, number, number][] = validTasks.map(t => [
    Number(t.latitude),
    Number(t.longitude),
    0.8 // Standard intensity
  ])

  // Center fallback to Jakarta area if no coordinates
  const defaultCenter: [number, number] = [-6.2088, 106.8456]
  const defaultZoom = 11

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-50">
      {mode === 'heatmap' && validTasks.length > 0 && (
        <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            id="toggle-markers"
            type="checkbox"
            checked={showMarkersOnHeatmap}
            onChange={(e) => setShowMarkersOnHeatmap(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
          />
          <label htmlFor="toggle-markers" className="cursor-pointer select-none">
            Tampilkan Marker Detail
          </label>
        </div>
      )}

      {validTasks.length === 0 ? (
        <div 
          style={{ height }} 
          className="flex flex-col items-center justify-center text-center p-6 gap-3 text-slate-500"
        >
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Tidak Ada Data Lokasi</h4>
            <p className="text-xs mt-1 text-slate-400 max-w-xs leading-relaxed">
              Tugas relawan yang disetujui tidak memiliki koordinat GPS yang valid untuk ditampilkan di peta.
            </p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={coordinates[0] || defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <AutoCenter coordinates={coordinates} />

          {mode === 'heatmap' && <HeatLayer points={heatPoints} />}

          {/* Render markers: Always in 'markers' mode, and optionally in 'heatmap' mode */}
          {(mode === 'markers' || showMarkersOnHeatmap) && 
            validTasks.map((task) => {
              const markerIcon = task.status === 'approved' ? icons.approved : (task.status === 'rejected' ? icons.rejected : icons.pending)
              const taskCat = getTaskCategory(task.type)
              
              return (
                <Marker 
                  key={task.id} 
                  position={[Number(task.latitude), Number(task.longitude)]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="w-56 text-slate-800">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {task.status === 'approved' ? 'Disetujui' : 'Pending'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(task.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold leading-snug">
                        {taskCat?.label || task.type}
                      </h4>
                      {task.company_name && (
                        <p className="text-[10px] text-slate-550 font-medium mt-1">
                          Sponsor: <span className="font-semibold text-slate-700">{task.company_name}</span>
                        </p>
                      )}
                      {task.location && (
                        <p className="text-[10px] text-slate-550 font-medium">
                          Area: <span className="font-semibold text-slate-700">{task.location}</span>
                        </p>
                      )}
                      {task.description && (
                        <p className="text-[11px] text-slate-650 bg-slate-50 border border-slate-100/80 rounded-lg p-1.5 mt-2 italic">
                          "{task.description}"
                        </p>
                      )}
                      {task.photo_url && (
                        <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-205 h-24 bg-slate-100 flex items-center justify-center">
                          <img 
                            src={task.photo_url} 
                            alt="Bukti aksi" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })
          }
        </MapContainer>
      )}
    </div>
  )
}
