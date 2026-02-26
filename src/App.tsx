import { useEffect, useRef, useState, useCallback } from 'react'
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
const UNLOCK_RADIUS = 150 // meters

// Calculate distance between two points in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Create pin icon with dynamic size
const createPinIcon = (size: number = 24) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <svg width="${size}" height="${size * 1.4}" viewBox="0 0 24 34" fill="none">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${ELECTRIC_BLUE}"/>
        <circle cx="12" cy="11" r="4.5" fill="white"/>
      </svg>
    `,
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
  })
}

// Create locked/ghost pin icon
const createLockedPinIcon = (size: number = 24) => {
  return L.divIcon({
    className: 'custom-pin locked',
    html: `
      <svg width="${size}" height="${size * 1.4}" viewBox="0 0 24 34" fill="none" opacity="0.3">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="#94a3b8"/>
        <circle cx="12" cy="11" r="4.5" fill="white"/>
      </svg>
    `,
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
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
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const userLocationRef = useRef<[number, number] | null>(null)
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    // Load saved progress from localStorage
    try {
      const saved = localStorage.getItem('detour-unlocked')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [infoLayer, setInfoLayer] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Save progress to localStorage whenever unlocked locations change
  useEffect(() => {
    try {
      localStorage.setItem('detour-unlocked', JSON.stringify(unlockedIds))
    } catch {
      // Ignore storage errors
    }
  }, [unlockedIds])

  // Get pin size based on zoom level
  const getPinSize = useCallback((zoom: number) => {
    if (zoom >= 18) return 28
    if (zoom >= 17) return 24
    if (zoom >= 16) return 20
    if (zoom >= 15) return 16
    if (zoom >= 14) return 14
    return 12
  }, [])

  // Update which locations are unlocked based on user position (merges with existing)
  const updateUnlockedLocations = useCallback((userLat: number, userLng: number) => {
    const nearbyIds = LOCATIONS
      .filter(loc => {
        const dist = getDistanceMeters(userLat, userLng, loc.coordinates[1], loc.coordinates[0])
        return dist <= UNLOCK_RADIUS
      })
      .map(loc => loc.id)
    
    // Merge with existing unlocked (don't remove previously unlocked)
    setUnlockedIds(prev => {
      const merged = new Set([...prev, ...nearbyIds])
      return Array.from(merged)
    })
  }, [])

  // Update marker icons based on unlock state and zoom
  const updateMarkers = useCallback((zoom: number) => {
    const size = getPinSize(zoom)
    markersRef.current.forEach((marker, id) => {
      const isUnlocked = unlockedIds.includes(id)
      marker.setIcon(isUnlocked ? createPinIcon(size) : createLockedPinIcon(size))
    })
  }, [unlockedIds, getPinSize])

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

    const initialZoom = 16
    mapInstance.current = L.map(mapRef.current, {
      center: PARIS_CENTER,
      zoom: initialZoom,
      zoomControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(mapInstance.current)

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current)

    // Add location markers (all start as locked/ghost)
    const initialSize = getPinSize(initialZoom)
    LOCATIONS.forEach(location => {
      const latLng: [number, number] = [location.coordinates[1], location.coordinates[0]]
      const marker = L.marker(latLng, { icon: createLockedPinIcon(initialSize) })
        .addTo(mapInstance.current!)
      
      marker.on('click', () => {
        // Only allow click if unlocked
        if (unlockedIds.includes(location.id)) {
          setSelectedLocation(location)
          setInfoLayer(0)
          mapInstance.current?.setView(latLng, 17, { animate: true })
        }
      })
      
      markersRef.current.set(location.id, marker)
    })

    // Update marker sizes on zoom
    mapInstance.current.on('zoomend', () => {
      const zoom = mapInstance.current?.getZoom() || 16
      updateMarkers(zoom)
    })

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLatLng: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          userLocationRef.current = userLatLng
          updateUnlockedLocations(userLatLng[0], userLatLng[1])
          
          // Add user marker using divIcon for proper glow effect
          const userIcon = L.divIcon({
            className: 'user-marker-container',
            html: '<div class="user-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
          
          userMarkerRef.current = L.marker(userLatLng, { icon: userIcon })
            .addTo(mapInstance.current!) as unknown as L.CircleMarker
          
          // Center on user if near Paris
          const distFromParis = Math.abs(userLatLng[0] - PARIS_CENTER[0]) + Math.abs(userLatLng[1] - PARIS_CENTER[1])
          if (distFromParis < 0.5) {
            mapInstance.current?.setView(userLatLng, 16)
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )

      // Watch position for updates
      navigator.geolocation.watchPosition(
        (pos) => {
          const userLatLng: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          userLocationRef.current = userLatLng
          userMarkerRef.current?.setLatLng(userLatLng)
          updateUnlockedLocations(userLatLng[0], userLatLng[1])
        },
        () => {},
        { enableHighAccuracy: true }
      )
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [showSplash, getPinSize, updateUnlockedLocations])

  // Update markers when unlocked state changes
  useEffect(() => {
    if (mapInstance.current) {
      const zoom = mapInstance.current.getZoom() || 16
      updateMarkers(zoom)
    }
  }, [unlockedIds, updateMarkers])

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
        <div className="status-badge">
          {unlockedIds.length > 0 
            ? `${unlockedIds.length} unlocked` 
            : 'Get closer to discover'}
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
      {!selectedLocation && unlockedIds.length > 0 && (
        <div className="tap-hint">
          <span>Tap a glowing pin to explore</span>
        </div>
      )}
    </div>
  )
}

export default App
