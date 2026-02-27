import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TimelineEvent {
  year: string
  title: string
  description: string
  image?: string
}

interface Location {
  id: string
  name: string
  coordinates: [number, number]
  period: string
  shortDesc: string
  image: string
  teaser: {
    era: string
    category: string
    hint: string
  }
  timeline: TimelineEvent[]
  funFact: string
}

const LOCATIONS: Location[] = [
  {
    id: 'nicolas-flamel',
    name: 'Maison de Nicolas Flamel',
    coordinates: [2.3549, 48.8619],
    period: '1407',
    shortDesc: "Paris's oldest stone house",
    image: './images/flamel.jpg',
    teaser: {
      era: 'Medieval',
      category: 'Architecture',
      hint: 'A legendary figure from both history and fiction once lived here...'
    },
    timeline: [
      {
        year: '1407',
        title: 'Construction',
        description: "Nicolas Flamel builds this house as a hostel for the poor. Lodgers were required to pray for the souls of Flamel and his wife Perenelle."
      },
      {
        year: '1418',
        title: "Flamel's Death",
        description: "Flamel dies wealthy, sparking rumors of alchemy. He was actually a successful scribe and manuscript dealer — the alchemy legends grew posthumously."
      },
      {
        year: '1900s',
        title: 'Rediscovery',
        description: "The building is recognized as Paris's oldest stone house. The carved inscriptions on the facade, worn but visible, become a tourist attraction."
      },
      {
        year: '1997',
        title: 'Potter Fame',
        description: "J.K. Rowling includes Nicolas Flamel in Harry Potter. Suddenly the real Flamel's house sees a new wave of visitors seeking the Philosopher's Stone."
      }
    ],
    funFact: "The carved inscriptions on the facade were instructions for the poor lodgers — medieval terms of service, essentially."
  },
  {
    id: 'synagogue-pavee',
    name: 'Synagogue Agudath Hakehilot',
    coordinates: [2.3589, 48.8551],
    period: '1913',
    shortDesc: "Art Nouveau masterpiece by Guimard",
    image: './images/synagogue.jpg',
    teaser: {
      era: 'Belle Époque',
      category: 'Religious',
      hint: 'The architect who shaped the Paris Métro created something unexpected here...'
    },
    timeline: [
      {
        year: '1913',
        title: 'Construction',
        description: "Hector Guimard, famous for Paris Métro entrances, designs this synagogue — his only religious building. The undulating concrete facade was revolutionary."
      },
      {
        year: '1940',
        title: 'Nazi Occupation',
        description: "During WWII, the synagogue is damaged but survives. The Marais Jewish community faces deportation; many never return."
      },
      {
        year: '1945',
        title: 'Liberation',
        description: "The synagogue reopens after the war. It becomes a symbol of the resilient Pletzl (Jewish quarter) community."
      },
      {
        year: '2019',
        title: 'Restoration',
        description: "Major restoration preserves Guimard's Art Nouveau details. The building is now one of the few Guimard interiors open to visitors."
      }
    ],
    funFact: "Guimard married an American Jewish woman — likely the reason he took this unusual commission."
  },
  {
    id: 'cafe-suedois',
    name: 'Swedish Institute & Café',
    coordinates: [2.3617, 48.8574],
    period: '1580s',
    shortDesc: "16th-century mansion turned cultural haven",
    image: './images/swedish.jpg',
    teaser: {
      era: 'Renaissance',
      category: 'Cultural',
      hint: 'A Nordic secret hides within these centuries-old walls...'
    },
    timeline: [
      {
        year: '1580s',
        title: 'Construction',
        description: "Hôtel de Marle is built as a Renaissance mansion. The stunning courtyard survives centuries of Parisian transformation largely intact."
      },
      {
        year: '1789',
        title: 'Revolution',
        description: "The owner, a tax collector, is murdered during the French Revolution. The building passes through various hands."
      },
      {
        year: '1971',
        title: 'Swedish Acquisition',
        description: "Sweden acquires the building and transforms it into a cultural center. A courtyard café introduces Parisians to fika."
      },
      {
        year: 'Today',
        title: 'Cultural Hub',
        description: "The café serves exceptional cinnamon buns and coffee. It's a hidden oasis where Swedish and French cultures blend."
      }
    ],
    funFact: "Fika isn't just a coffee break — it's a Swedish philosophy of slowing down and connecting with others."
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

// Collected/unlocked pin - with checkmark badge
const createPinIcon = (size: number = 24) => {
  return L.divIcon({
    className: 'custom-pin collected',
    html: `
      <div class="collected-marker">
        <svg width="${size}" height="${size * 1.4}" viewBox="0 0 24 34" fill="none">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${ELECTRIC_BLUE}"/>
          <circle cx="12" cy="11" r="5" fill="white"/>
          <path d="M9 11l2 2 4-4" stroke="${ELECTRIC_BLUE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="collected-check">✓</div>
      </div>
    `,
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
  })
}

// Create locked location marker (rounded box - light blue)
const createLockedPinIcon = (size: number = 24) => {
  const boxSize = size * 0.8
  return L.divIcon({
    className: 'custom-pin locked',
    html: `
      <div style="
        width: ${boxSize}px;
        height: ${boxSize}px;
        background: rgba(0, 128, 255, 0.1);
        border: 2px solid rgba(0, 128, 255, 0.3);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${boxSize * 0.5}px;
        backdrop-filter: blur(4px);
      ">🔒</div>
    `,
    iconSize: [boxSize, boxSize],
    iconAnchor: [boxSize / 2, boxSize / 2],
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

// Locked Location Card Component
function LockedCard({ location, distance, onClose }: {
  location: Location
  distance: number | null
  onClose: () => void
}) {
  const formatDistance = (d: number) => {
    if (d < 1000) return `${Math.round(d)}m`
    return `${(d / 1000).toFixed(1)}km`
  }

  return (
    <div className="locked-card">
      <button className="card-close" onClick={onClose}>×</button>
      <div className="locked-icon">🔒</div>
      <div className="locked-title">Location Locked</div>

      {distance !== null && (
        <div className="locked-distance">
          <span className="distance-value">{formatDistance(distance)} away</span>
          <span className="distance-hint">Get within 150m to unlock</span>
        </div>
      )}
      
      <div className="locked-teaser">
        <div className="teaser-stats">
          <div className="teaser-stat">
            <span className="stat-label">Era</span>
            <span className="stat-value">{location.teaser.era}</span>
          </div>
          <div className="teaser-stat">
            <span className="stat-label">Type</span>
            <span className="stat-value">{location.teaser.category}</span>
          </div>
        </div>
        <div className="teaser-hint">
          <span className="hint-label">Hint</span>
          <p>{location.teaser.hint}</p>
        </div>
      </div>
    </div>
  )
}

// Floating Info Card Component with Timeline
function InfoCard({ location, layer, onClose, onPrev, onNext }: { 
  location: Location
  layer: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void 
}) {
  const totalLayers = location.timeline.length + 1 // timeline events + fun fact
  const hasPrev = layer > 0
  const hasNext = layer < totalLayers - 1
  
  // Last layer is the fun fact
  const isFunFact = layer === location.timeline.length
  const currentEvent = !isFunFact ? location.timeline[layer] : null
  
  return (
    <div className="info-card">
      <button className="card-close" onClick={onClose}>×</button>
      
      {/* Single image for the location */}
      <div className="card-image">
        <img src={location.image} alt={location.name} />
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <div className="card-title">{location.name}</div>
          <div className="card-subtitle">{location.shortDesc}</div>
        </div>
        
        {!isFunFact && currentEvent ? (
          <div className="timeline-event">
            <div className="event-year">{currentEvent.year}</div>
            <div className="event-title">{currentEvent.title}</div>
            <div className="event-desc">{currentEvent.description}</div>
          </div>
        ) : (
          <div className="fun-fact-section">
            <div className="fun-fact-label">💡 Fun Fact</div>
            <div className="fun-fact-text">{location.funFact}</div>
          </div>
        )}
        
        <div className="card-nav">
          <button 
            className={`nav-arrow ${!hasPrev ? 'disabled' : ''}`} 
            onClick={onPrev}
            disabled={!hasPrev}
          >
            ←
          </button>
          <div className="card-dots">
            {Array.from({ length: totalLayers }).map((_, i) => (
              <div 
                key={i} 
                className={`dot ${i === layer ? 'active' : ''} ${i === totalLayers - 1 ? 'fun-fact-dot' : ''}`} 
              />
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
        
        <div className="timeline-indicator">
          {!isFunFact ? `${layer + 1} of ${location.timeline.length} events` : 'Bonus fact'}
        </div>
      </div>
    </div>
  )
}

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const userGlowOuterRef = useRef<L.CircleMarker | null>(null)
  const userGlowInnerRef = useRef<L.CircleMarker | null>(null)
  const userLocationRef = useRef<[number, number] | null>(null)
  const hasCenteredOnUserRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)
  const unlockedIdsRef = useRef<string[]>(['nicolas-flamel'])
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [lockedLocation, setLockedLocation] = useState<Location | null>(null)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [showTracker, setShowTracker] = useState(false)
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    // Load saved progress from localStorage
    try {
      const saved = localStorage.getItem('detour-unlocked')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure at least one location is unlocked for demo
        if (!parsed.includes('nicolas-flamel')) {
          parsed.push('nicolas-flamel')
        }
        unlockedIdsRef.current = parsed
        return parsed
      }
      // Default: unlock first location for demo
      return ['nicolas-flamel']
    } catch (e) {
      console.error('Failed to load saved progress:', e)
      return ['nicolas-flamel']
    }
  })
  const [infoLayer, setInfoLayer] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Calculate distance to a location
  const getDistanceToLocation = useCallback((loc: Location) => {
    if (!userPosition) return null
    return getDistanceMeters(userPosition[0], userPosition[1], loc.coordinates[1], loc.coordinates[0])
  }, [userPosition])

  // Save progress to localStorage whenever unlocked locations change
  useEffect(() => {
    unlockedIdsRef.current = unlockedIds
    try {
      localStorage.setItem('detour-unlocked', JSON.stringify(unlockedIds))
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }, [unlockedIds])

  // Get pin size based on zoom level
  const getPinSize = useCallback((zoom: number) => {
    if (zoom >= 18) return 40
    if (zoom >= 17) return 34
    if (zoom >= 16) return 28
    if (zoom >= 15) return 24
    if (zoom >= 14) return 20
    return 16
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
      const isUnlocked = unlockedIdsRef.current.includes(id)
      marker.setIcon(isUnlocked ? createPinIcon(size) : createLockedPinIcon(size))
    })
  }, [getPinSize])

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
      const isUnlocked = unlockedIdsRef.current.includes(location.id)
      const marker = L.marker(latLng, { 
        icon: isUnlocked ? createPinIcon(initialSize) : createLockedPinIcon(initialSize) 
      }).addTo(mapInstance.current!)
      
      marker.on('click', () => {
        // Use ref to get current unlocked state (avoids stale closure)
        if (unlockedIdsRef.current.includes(location.id)) {
          setSelectedLocation(location)
          setLockedLocation(null)
          setInfoLayer(0)
        } else {
          setLockedLocation(location)
          setSelectedLocation(null)
        }
        mapInstance.current?.setView(latLng, 17, { animate: true })
      })
      
      markersRef.current.set(location.id, marker)
    })

    // Update marker sizes on zoom
    mapInstance.current.on('zoomend', () => {
      const zoom = mapInstance.current?.getZoom() || 16
      updateMarkers(zoom)
    })

    // Get user location - only center on first acquisition
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLatLng: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          userLocationRef.current = userLatLng
          setUserPosition(userLatLng)
          updateUnlockedLocations(userLatLng[0], userLatLng[1])
          
          // Use native CircleMarker for better mobile compatibility
          // Outer glow circle
          userGlowOuterRef.current = L.circleMarker(userLatLng, {
            radius: 24,
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            stroke: false,
            className: 'user-glow-outer'
          }).addTo(mapInstance.current!)
          
          // Inner glow circle
          userGlowInnerRef.current = L.circleMarker(userLatLng, {
            radius: 16,
            fillColor: '#22c55e',
            fillOpacity: 0.3,
            stroke: false,
            className: 'user-glow-inner'
          }).addTo(mapInstance.current!)
          
          // Main user dot
          userMarkerRef.current = L.circleMarker(userLatLng, {
            radius: 8,
            fillColor: '#22c55e',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 3,
            className: 'user-dot-marker'
          }).addTo(mapInstance.current!)
          
          // Only center on user once (first time)
          if (!hasCenteredOnUserRef.current) {
            mapInstance.current?.setView(userLatLng, 16)
            hasCenteredOnUserRef.current = true
          }
        },
        (err) => {
          console.log('Geolocation error:', err)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )

      // Watch position for updates - just update marker position, don't re-center
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const userLatLng: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          userLocationRef.current = userLatLng
          setUserPosition(userLatLng)
          // Update all user marker layers
          userMarkerRef.current?.setLatLng(userLatLng)
          userGlowOuterRef.current?.setLatLng(userLatLng)
          userGlowInnerRef.current?.setLatLng(userLatLng)
          updateUnlockedLocations(userLatLng[0], userLatLng[1])
        },
        (err) => console.log('Position watch error:', err.code, err.message),
        { enableHighAccuracy: true }
      )
    }

    return () => {
      // Clear geolocation watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      // Clear marker refs
      userMarkerRef.current = null
      userGlowOuterRef.current = null
      userGlowInnerRef.current = null
      markersRef.current.clear()
      // Remove map
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
    if (selectedLocation) {
      const maxLayer = selectedLocation.timeline.length // timeline events + fun fact
      setInfoLayer(prev => Math.min(prev + 1, maxLayer))
    }
  }

  // Calculate nearest locked location
  const getNearestLocked = useCallback(() => {
    if (!userPosition) return null
    const lockedLocations = LOCATIONS.filter(loc => !unlockedIds.includes(loc.id))
    if (lockedLocations.length === 0) return null
    
    let nearest = lockedLocations[0]
    let nearestDist = getDistanceMeters(userPosition[0], userPosition[1], nearest.coordinates[1], nearest.coordinates[0])
    
    for (const loc of lockedLocations) {
      const dist = getDistanceMeters(userPosition[0], userPosition[1], loc.coordinates[1], loc.coordinates[0])
      if (dist < nearestDist) {
        nearest = loc
        nearestDist = dist
      }
    }
    
    return { location: nearest, distance: nearestDist }
  }, [userPosition, unlockedIds])

  const nearestLocked = getNearestLocked()

  // Format distance for display
  const formatDistance = (d: number) => {
    if (d < 1000) return `${Math.round(d)}m`
    return `${(d / 1000).toFixed(1)}km`
  }

  // Status badge text
  const getStatusText = () => {
    if (unlockedIds.length === LOCATIONS.length) {
      return '✨ All discovered!'
    }
    if (nearestLocked && userPosition) {
      return `${formatDistance(nearestLocked.distance)} to nearest`
    }
    return `${unlockedIds.length}/${LOCATIONS.length} discovered`
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
        <button 
          className="status-badge" 
          onClick={() => setShowTracker(!showTracker)}
        >
          {getStatusText()}
        </button>
      </div>

      {/* Progress Tracker Panel */}
      {showTracker && (
        <div className="tracker-panel">
          <div className="tracker-header">
            <h3>Your Discoveries</h3>
            <button className="tracker-close" onClick={() => setShowTracker(false)}>×</button>
          </div>
          <div className="tracker-progress">
            <div 
              className="tracker-bar" 
              style={{ width: `${(unlockedIds.length / LOCATIONS.length) * 100}%` }}
            />
          </div>
          <div className="tracker-list">
            {LOCATIONS.map(loc => {
              const isUnlocked = unlockedIds.includes(loc.id)
              return (
                <div 
                  key={loc.id} 
                  className={`tracker-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedLocation(loc)
                      setLockedLocation(null)
                      setInfoLayer(0)
                      setShowTracker(false)
                      const latLng: [number, number] = [loc.coordinates[1], loc.coordinates[0]]
                      mapInstance.current?.setView(latLng, 17, { animate: true })
                    }
                  }}
                >
                  <div className="tracker-icon">{isUnlocked ? '✓' : '🔒'}</div>
                  <div className="tracker-info">
                    <div className="tracker-name">{isUnlocked ? loc.name : '???'}</div>
                    <div className="tracker-period">{isUnlocked ? loc.period : 'Undiscovered'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Info Card */}
      {selectedLocation && !showTracker && (
        <InfoCard 
          location={selectedLocation}
          layer={infoLayer}
          onClose={handleCloseCard}
          onPrev={handlePrevLayer}
          onNext={handleNextLayer}
        />
      )}

      {/* Locked Location Card */}
      {lockedLocation && !showTracker && (
        <LockedCard 
          location={lockedLocation}
          distance={getDistanceToLocation(lockedLocation)}
          onClose={() => setLockedLocation(null)}
        />
      )}

      {/* Recenter button */}
      {userPosition && (
        <button 
          className="recenter-btn"
          onClick={() => {
            if (userPosition && mapInstance.current) {
              mapInstance.current.setView(userPosition, 16, { animate: true })
            }
          }}
        >
          📍
        </button>
      )}

      {/* Tap hint */}
      {!selectedLocation && !lockedLocation && !showTracker && (
        <div className="tap-hint">
          <span>Tap any pin to explore</span>
        </div>
      )}
    </div>
  )
}

export default App
