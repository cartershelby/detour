import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Location {
  id: string
  name: string
  coordinates: [number, number] // [lng, lat]
  period: string
  description: string
  funFact: string
}

const LOCATIONS: Location[] = [
  {
    id: 'nicolas-flamel',
    name: 'Maison de Nicolas Flamel',
    coordinates: [2.3549, 48.8619],
    period: '1407',
    description: "Paris's oldest stone house, built by the legendary alchemist Nicolas Flamel. Yes, that Nicolas Flamel — the one from Harry Potter was based on a real person who lived here.",
    funFact: 'Flamel was a successful scribe and manuscript dealer. The alchemy legends grew after his death when people noticed he had become mysteriously wealthy.'
  },
  {
    id: 'synagogue-pavee',
    name: 'Synagogue Agudath Hakehilot',
    coordinates: [2.3589, 48.8551],
    period: '1913',
    description: "Art Nouveau synagogue designed by Hector Guimard (famous for Paris Métro entrances). One of the few Guimard buildings you can enter.",
    funFact: "Guimard married an American Jewish woman, which likely influenced his decision to design this synagogue — his only religious building."
  },
  {
    id: 'cafe-suedois',
    name: 'Swedish Institute & Café',
    coordinates: [2.3617, 48.8574],
    period: '1580s / 1971',
    description: "A 16th-century Marais mansion converted into a Swedish cultural center. The courtyard café serves exceptional fika (Swedish coffee break).",
    funFact: "The building was once owned by a tax collector who was murdered during the French Revolution."
  }
]

const PARIS_CENTER: [number, number] = [48.8590, 2.3580] // Center on locations
const BRAND_BLUE = '#047AE0'

// SVG Pin that replaces the T in Détour
const PinIcon = ({ size = 20, color = BRAND_BLUE }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size * 1.4} 
    viewBox="0 0 24 34" 
    fill="none" 
    style={{ display: 'inline-block', verticalAlign: 'baseline', marginBottom: '-4px' }}
  >
    <path 
      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" 
      fill={color}
    />
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>
)

// Logo component - Dé[pin]our Obscura
function Logo({ size = 'md', showSubtitle = true }: { size?: 'sm' | 'md' | 'lg'; showSubtitle?: boolean }) {
  const config = {
    sm: { fontSize: 18, pinSize: 14, subSize: 9, gap: 4 },
    md: { fontSize: 24, pinSize: 18, subSize: 11, gap: 6 },
    lg: { fontSize: 42, pinSize: 32, subSize: 16, gap: 10 }
  }
  const c = config[size]
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{ 
        fontSize: c.fontSize, 
        fontWeight: 600, 
        color: '#1a1a2e',
        letterSpacing: '-0.01em'
      }}>
        Dé
      </span>
      <PinIcon size={c.pinSize} />
      <span style={{ 
        fontSize: c.fontSize, 
        fontWeight: 600, 
        color: '#1a1a2e',
        letterSpacing: '-0.01em'
      }}>
        our
      </span>
      {showSubtitle && (
        <span style={{ 
          fontSize: c.subSize, 
          fontWeight: 400, 
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginLeft: c.gap
        }}>
          Obscura
        </span>
      )}
    </div>
  )
}

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showSplash, setShowSplash] = useState(true)

  // Hide splash after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || showSplash) return

    mapInstance.current = L.map(mapRef.current, {
      center: PARIS_CENTER,
      zoom: 15,
      zoomControl: false
    })

    // CARTO light tiles - clean and minimal
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(mapInstance.current)

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current)

    // Add ALL location markers immediately
    LOCATIONS.forEach(location => {
      const latLng: [number, number] = [location.coordinates[1], location.coordinates[0]]
      
      const marker = L.circleMarker(latLng, {
        radius: 12,
        fillColor: BRAND_BLUE,
        fillOpacity: 0.9,
        color: 'white',
        weight: 3
      }).addTo(mapInstance.current!)

      marker.on('click', () => {
        setSelectedLocation(location)
        mapInstance.current?.setView(latLng, 17, { animate: true })
        
        // Update marker sizes
        markersRef.current.forEach((m, id) => {
          m.setRadius(id === location.id ? 16 : 12)
        })
      })

      markersRef.current.set(location.id, marker)
    })

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [showSplash])

  // Update marker sizes when selection changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setRadius(selectedLocation?.id === id ? 16 : 12)
    })
  }, [selectedLocation])

  if (showSplash) {
    return (
      <div className="splash">
        <div className="splash-content">
          <Logo size="lg" showSubtitle={false} />
          <p className="splash-sub">Obscura</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div ref={mapRef} className="map" />
      
      {/* Header */}
      <div className="header">
        <div className="logo-container">
          <Logo size="sm" />
        </div>
        <div className="status">
          <span>{LOCATIONS.length} locations</span>
        </div>
      </div>

      {/* Location card */}
      {selectedLocation && (
        <div className="card">
          <button className="card-close" onClick={() => setSelectedLocation(null)}>×</button>
          <div className="card-period">{selectedLocation.period}</div>
          <h2 className="card-title">{selectedLocation.name}</h2>
          <p className="card-desc">{selectedLocation.description}</p>
          <div className="card-fact">
            <strong>Fun fact:</strong> {selectedLocation.funFact}
          </div>
        </div>
      )}

      {/* Tap hint when no selection */}
      {!selectedLocation && (
        <div className="tap-hint">
          <p>Tap a marker to explore</p>
        </div>
      )}
    </div>
  )
}

export default App
