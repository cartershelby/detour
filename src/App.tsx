import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Create map centered on Paris 3ème
    mapInstance.current = L.map(mapRef.current).setView([48.8637, 2.3615], 15)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance.current)

    // Add a test marker
    L.marker([48.8637, 2.3615])
      .addTo(mapInstance.current)
      .bindPopup('Détour Obscure')
      .openPopup()

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default App
