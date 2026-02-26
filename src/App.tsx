import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Location {
  id: string
  name: string
  coordinates: [number, number]
  period: string
  shortDesc: string
  layers: {
    description: string
    funFact: string
    deeperHistory?: string
    connections?: string
  }
}

const LOCATIONS: Location[] = [
  {
    id: 'nicolas-flamel',
    name: 'Maison de Nicolas Flamel',
    coordinates: [2.3549, 48.8619],
    period: '1407',
    shortDesc: "Paris's oldest stone house",
    layers: {
      description: "Built by the legendary alchemist Nicolas Flamel — yes, the one from Harry Potter was based on a real person who lived right here in the Marais.",
      funFact: "Flamel was actually a successful scribe and manuscript dealer. The alchemy legends grew after his death when people noticed he had become mysteriously wealthy.",
      deeperHistory: "The house was built as a hostel for the poor, with the requirement that lodgers pray for the souls of Flamel and his wife Perenelle. The carved inscriptions on the facade still survive.",
      connections: "Walk 200m east to find the Tour Saint-Jacques, where Flamel allegedly conducted alchemical experiments."
    }
  },
  {
    id: 'synagogue-pavee',
    name: 'Synagogue Agudath Hakehilot',
    coordinates: [2.3589, 48.8551],
    period: '1913',
    shortDesc: "Art Nouveau masterpiece by Guimard",
    layers: {
      description: "Designed by Hector Guimard, famous for those iconic Paris Métro entrances. This is one of the few Guimard buildings you can actually enter.",
      funFact: "Guimard married an American Jewish woman, which likely influenced his decision to design this synagogue — his only religious building ever.",
      deeperHistory: "The synagogue survived Nazi occupation but was damaged. The undulating concrete facade was revolutionary for religious architecture at the time.",
      connections: "The Pletzl (Jewish quarter) surrounds this area — explore rue des Rosiers for more history."
    }
  },
  {
    id: 'cafe-suedois',
    name: 'Swedish Institute & Café',
    coordinates: [2.3617, 48.8574],
    period: '1580s',
    shortDesc: "16th-century mansion turned cultural haven",
    layers: {
      description: "A Renaissance-era Marais mansion converted into a Swedish cultural center. The courtyard café serves exceptional fika (Swedish coffee break with pastries).",
      funFact: "The building was once owned by a tax collector who was murdered during the French Revolution. The Swedes acquired it in 1971.",
      deeperHistory: "The Hôtel de Marle features a stunning Renaissance courtyard that survived centuries of Parisian transformation largely intact.",
      connections: "The nearby Musée Picasso occupies a similar 17th-century mansion — both showcase how the aristocracy once lived."
    }
  }
]

const PARIS_CENTER: [number, number] = [48.8590, 2.3580]
const ELECTRIC_BLUE = '#0080FF'

// SVG Pin Icon for markers
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <svg width="32" height="44" viewBox="0 0 24 34" fill="none" style="filter: drop-shadow(0 0 10px rgba(0, 128, 255, 0.7));">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${ELECTRIC_BLUE}"/>
        <circle cx="12" cy="11" r="4.5" fill="white"/>
      </svg>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
  })
}

// Logo Component
function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    sm: { fontSize: 17, pinW: 13, pinH: 18, subSize: 8, gap: 6 },
    md: { fontSize: 28, pinW: 22, pinH: 30, subSize: 11, gap: 8 },
    lg: { fontSize: 52, pinW: 38, pinH: 52, subSize: 14, gap: 12 }
  }
  const c = config[size]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontSize: c.fontSize, fontWeight: 300, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
          dé
        </span>
        <svg width={c.pinW} height={c.pinH} viewBox="0 0 24 34" fill="none" style={{ margin: '0 -1px', marginBottom: size === 'lg' ? -8 : size === 'md' ? -5 : -3 }}>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill={ELECTRIC_BLUE}/>
          <circle cx="12" cy="11" r="4.5" fill="white"/>
        </svg>
        <span style={{ fontSize: c.fontSize, fontWeight: 300, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
          our
        </span>
      </div>
      <span style={{ 
        fontSize: c.subSize, 
        fontWeight: 400, 
        color: '#94a3b8', 
        letterSpacing: '0.35em',
        marginTop: c.gap 
      }}>
        obscura
      </span>
    </div>
  )
}

// Floating Info Card Component
function InfoCard({ location, layer, onClose, onPrev, onNext }: { 
  location: Location
  layer: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void 
}) {
  const layerContent = [
    location.layers.description,
    location.layers.funFact,
    location.layers.deeperHistory,
    location.layers.connections
  ].filter(Boolean)
  
  const currentContent = layerContent[layer] || layerContent[0]
  const hasPrev = layer > 0
  const hasNext = layer < layerContent.length - 1
  
  const layerLabels = ['Story', 'Fun Fact', 'Deeper History', 'Connections']
  
  return (
    <div className="info-card">
      <button className="card-close" onClick={onClose}>×</button>
      <div className="card-period">{location.period}</div>
      <div className="card-title">{location.name}</div>
      <div className="card-layer-label">{layerLabels[layer]}</div>
      <div className="card-desc">{currentContent}</div>
      
      {/* Navigation arrows */}
      <div className="card-nav">
        <button 
          className={`nav-arrow ${!hasPrev ? 'disabled' : ''}`} 
          onClick={onPrev}
          disabled={!hasPrev}
        >
          ←
        </button>
        <div className="card-dots">
          {layerContent.map((_, i) => (
            <div key={i} className={`dot ${i === layer ? 'active' : ''}`} />
          ))}
        </div>
        <button 
          className={`nav-arrow ${!hasNext ? 'disabled' : ''}`} 
          onClick={onNext}
          disabled={!hasNext}
        >
          →
        </button>
      </div>
    </div>
  )
}

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [infoLayer, setInfoLayer] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Splash screen with slow fade
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500)
    const hideTimer = setTimeout(() => setShowSplash(false), 3500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || showSplash) return

    mapInstance.current = L.map(mapRef.current, {
      center: PARIS_CENTER,
      zoom: 16,
      zoomControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(mapInstance.current)

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current)

    // Add markers
    LOCATIONS.forEach(location => {
      const latLng: [number, number] = [location.coordinates[1], location.coordinates[0]]
      const marker = L.marker(latLng, { icon: createPinIcon() })
        .addTo(mapInstance.current!)
      
      marker.on('click', () => {
        setSelectedLocation(location)
        setInfoLayer(0)
        mapInstance.current?.setView(latLng, 17, { animate: true })
      })
      
      markersRef.current.set(location.id, marker)
    })

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [showSplash])

  const handleCloseCard = () => {
    setSelectedLocation(null)
    setInfoLayer(0)
  }

  const handlePrevLayer = () => {
    setInfoLayer(prev => Math.max(0, prev - 1))
  }

  const handleNextLayer = () => {
    setInfoLayer(prev => prev + 1)
  }

  if (showSplash) {
    return (
      <div className={`splash ${fadeOut ? 'fade-out' : ''}`}>
        <Logo size="lg" />
      </div>
    )
  }

  return (
    <div className="app">
      <div ref={mapRef} className="map" />
      
      {/* Header */}
      <div className="header">
        <div className="header-logo">
          <Logo size="sm" />
        </div>
      </div>

      {/* Floating Info Card */}
      {selectedLocation && (
        <InfoCard 
          location={selectedLocation}
          layer={infoLayer}
          onClose={handleCloseCard}
          onPrev={handlePrevLayer}
          onNext={handleNextLayer}
        />
      )}

      {/* Tap hint */}
      {!selectedLocation && (
        <div className="tap-hint">
          <span>Tap a pin to explore</span>
        </div>
      )}
    </div>
  )
}

export default App
