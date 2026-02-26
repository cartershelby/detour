import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon path issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

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

const PARIS_CENTER: [number, number] = [48.8637, 2.3615]
const UNLOCK_RADIUS = 200 // meters

function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  // Hide splash after 2s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Update unlocked locations when user moves
  const updateUnlocked = useCallback((userLat: number, userLng: number) => {
    const newUnlocked = LOCATIONS
      .filter(loc => {
        const dist = getDistanceInMeters(userLat, userLng, loc.coordinates[1], loc.coordinates[0])
        return dist <= UNLOCK_RADIUS
      })
      .map(loc => loc.id)
    setUnlockedIds(newUnlocked)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || showSplash) return

    mapInstance.current = L.map(mapRef.current, {
      center: PARIS_CENTER,
      zoom: 16,
      zoomControl: false
    })

    // Add subtle grayscale tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(mapInstance.current)

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current)

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(coords)
          setIsLocating(false)
          updateUnlocked(coords[0], coords[1])
          
          // User marker - green dot
          userMarkerRef.current = L.circleMarker(coords, {
            radius: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            color: 'white',
            weight: 3
          }).addTo(mapInstance.current!)
          
          mapInstance.current?.setView(coords, 16)
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 10000 }
      )

      // Watch position for updates
      navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(coords)
          updateUnlocked(coords[0], coords[1])
          userMarkerRef.current?.setLatLng(coords)
        },
        () => {},
        { enableHighAccuracy: true }
      )
    } else {
      setIsLocating(false)
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [showSplash, updateUnlocked])

  // Update location markers
  useEffect(() => {
    if (!mapInstance.current) return

    LOCATIONS.forEach(loc => {
      const isUnlocked = unlockedIds.includes(loc.id)
      const isSelected = selectedLocation?.id === loc.id
      const existing = markersRef.current.get(loc.id)

      // Remove if locked and not selected
      if (!isUnlocked && !isSelected && existing) {
        existing.remove()
        markersRef.current.delete(loc.id)
        return
      }

      // Add if should be visible
      if ((isUnlocked || isSelected) && !existing) {
        const latLng: [number, number] = [loc.coordinates[1], loc.coordinates[0]]
        const marker = L.circleMarker(latLng, {
          radius: isSelected ? 12 : 10,
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          color: 'white',
          weight: 3
        }).addTo(mapInstance.current!)

        marker.on('click', () => {
          setSelectedLocation(loc)
          mapInstance.current?.setView(latLng, 17, { animate: true })
        })

        // Add pulsing animation via CSS class
        const el = marker.getElement()
        if (el) el.classList.add('pulse-marker')

        markersRef.current.set(loc.id, marker)
      }
    })
  }, [unlockedIds, selectedLocation])

  if (showSplash) {
    return (
      <div className="splash">
        <div className="splash-content">
          <h1>Détour</h1>
          <p>Obscure</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div ref={mapRef} className="map" />
      
      {/* Header */}
      <div className="header">
        <div className="logo">
          <span className="logo-text">Détour</span>
          <span className="logo-sub">Obscure</span>
        </div>
        <div className="status">
          <div className={`status-dot ${isLocating ? 'locating' : 'ready'}`} />
          <span>{isLocating ? 'Finding you...' : `${unlockedIds.length} nearby`}</span>
        </div>
      </div>

      {/* Empty state hint */}
      {unlockedIds.length === 0 && !isLocating && !selectedLocation && (
        <div className="hint">
          <p>Walk within 200m of a location to unlock its story</p>
        </div>
      )}

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
    </div>
  )
}

export default App
