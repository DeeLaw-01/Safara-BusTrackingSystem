import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowLeft,
  GripVertical,
  Trash2,
  Loader2,
  Route as RouteIcon,
  MapPin,
  Navigation,
  Lock,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Clock
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { routesApi, stopsApi } from '@/services/api'
import type { Route, Stop } from '@/types'

// ─── Stop marker icon factory ────────────────────────────────────────────────

function createStopIcon (index: number, isFirst: boolean, isLast: boolean) {
  const color = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#0ea5e9'
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: ${color}; color: white;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${index + 1}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

// ─── Map click handler component ─────────────────────────────────────────────

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
  disabled: boolean
}

function MapClickHandler ({ onMapClick, disabled }: MapClickHandlerProps) {
  useMapEvents({
    click (e) {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

// ─── Draggable map marker for stops ──────────────────────────────────────────

interface DraggableStopMarkerProps {
  stop: Stop
  index: number
  totalStops: number
  draggable: boolean
  onDragEnd: (stopId: string, lat: number, lng: number) => void
}

function DraggableStopMarker ({
  stop,
  index,
  totalStops,
  draggable,
  onDragEnd
}: DraggableStopMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend () {
        const marker = markerRef.current
        if (marker) {
          const pos = marker.getLatLng()
          onDragEnd(stop._id, pos.lat, pos.lng)
        }
      }
    }),
    [stop._id, onDragEnd]
  )

  return (
    <Marker
      ref={markerRef}
      position={[stop.latitude, stop.longitude]}
      icon={createStopIcon(index, index === 0, index === totalStops - 1)}
      draggable={draggable}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="">
          <div className="">{stop.name}</div>
          <div className="">
            Stop #{index + 1}
            {draggable && ' • Drag to reposition'}
          </div>
          {stop.estimatedArrivalTime && (
            <div className="">
              ETA: {stop.estimatedArrivalTime}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

// ─── Sortable stop item ─────────────────────────────────────────────────────

interface SortableStopProps {
  stop: Stop
  index: number
  totalStops: number
  isLocked: boolean
  editingStopId: string | null
  editingStopName: string
  onStartEdit: (stop: Stop) => void
  onSaveEdit: (stopId: string) => void
  onCancelEdit: () => void
  onEditNameChange: (name: string) => void
  onDelete: (stopId: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onTimeChange: (stopId: string, time: string) => void
}

function SortableStop ({
  stop,
  index,
  totalStops,
  isLocked,
  editingStopId,
  editingStopName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTimeChange
}: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stop._id, disabled: isLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined
  }

  const isFirst = index === 0
  const isLast = index === totalStops - 1
  const isEditing = editingStopId === stop._id
  const markerColor = isFirst
    ? 'bg-green-500'
    : isLast
    ? 'bg-red-500'
    : 'bg-primary'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
        isDragging
          ? 'bg-white border-primary shadow-lg'
          : 'bg-white border-ui-border hover:border-primary/30 shadow-sm'
      }`}
    >
      {/* Drag handle */}
      {!isLocked && (
        <button
          {...attributes}
          {...listeners}
          className=""
          title='Drag to reorder'
        >
          <GripVertical className="" />
        </button>
      )}

      {/* Number badge */}
      <div
        className={`mt-0.5 w-7 h-7 rounded-full ${markerColor} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      >
        {index + 1}
      </div>

      {/* Stop info */}
      <div className="">
        {isEditing ? (
          <div className="">
            <input
              type='text'
              value={editingStopName}
              onChange={e => onEditNameChange(e.target.value)}
              className=""
              autoFocus
              title='Stop name'
              placeholder='Enter stop name'
              onKeyDown={e => {
                if (e.key === 'Enter') onSaveEdit(stop._id)
                if (e.key === 'Escape') onCancelEdit()
              }}
            />
            <button
              onClick={() => onSaveEdit(stop._id)}
              className=""
              title='Save'
            >
              <Check className="" />
            </button>
            <button
              onClick={onCancelEdit}
              className=""
              title='Cancel'
            >
              <X className="" />
            </button>
          </div>
        ) : (
          <div className="">
            <span className="">
              {stop.name}
            </span>
            {!isLocked && (
              <button
                onClick={() => onStartEdit(stop)}
                className=""
                title='Rename stop'
              >
                <Pencil className="" />
              </button>
            )}
          </div>
        )}
        <div className="">
          {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
        </div>

        {/* Estimated time */}
        <div className="">
          <Clock className="" />
          <label className="" htmlFor={`time-${stop._id}`}>
            Estimated arrival time
          </label>
          <input
            id={`time-${stop._id}`}
            type='time'
            value={stop.estimatedArrivalTime || ''}
            onChange={e => onTimeChange(stop._id, e.target.value)}
            disabled={isLocked}
            className=""
            title='Estimated arrival time'
            placeholder='HH:MM'
          />
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className=""
            title='Move up'
          >
            <ChevronUp className="" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalStops - 1}
            className=""
            title='Move down'
          >
            <ChevronDown className="" />
          </button>
          <button
            onClick={() => onDelete(stop._id)}
            className=""
            title='Delete stop'
          >
            <Trash2 className="" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main RouteBuilder Component ─────────────────────────────────────────────

export default function RouteBuilder () {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const mapRef = useRef<L.Map | null>(null)

  // State
  const [route, setRoute] = useState<Route | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [routePath, setRoutePath] = useState<[number, number][]>([])
  const [loading, setLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [lockMessage, setLockMessage] = useState('')
  const [addingStop, setAddingStop] = useState(false)
  const [generatingPath, setGeneratingPath] = useState(false)
  const [savingReorder, setSavingReorder] = useState(false)
  const [editingStopId, setEditingStopId] = useState<string | null>(null)
  const [editingStopName, setEditingStopName] = useState('')
  const [pathInfo, setPathInfo] = useState<{
    distance: number
    duration: number
  } | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Toast helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 3000)
    },
    []
  )

  // ─── Load route data ───────────────────────────────────────────────────────

  const loadRoute = useCallback(async () => {
    if (!id) return
    try {
      const [routeRes, editRes] = await Promise.all([
        routesApi.getById(id),
        routesApi.canEdit(id)
      ])

      const routeData = routeRes.data.data as Route
      setRoute(routeData)
      setStops(
        (routeData.stops || [])
          .slice()
          .sort((a: Stop, b: Stop) => a.sequence - b.sequence)
      )
      if (routeData.path) {
        setRoutePath(routeData.path)
      }

      const editData = editRes.data.data as {
        canEdit: boolean
        activeTrips: number
        message: string
      }
      setIsLocked(!editData.canEdit)
      setLockMessage(editData.message)
    } catch (error) {
      console.error('Failed to load route:', error)
      showToast('Failed to load route', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, showToast])

  useEffect(() => {
    loadRoute()
  }, [loadRoute])

  // ─── Map click → add stop ──────────────────────────────────────────────────

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!id || isLocked || addingStop) return
      setAddingStop(true)

      try {
        // Reverse geocode
        let stopName = `Stop ${stops.length + 1}`
        try {
          const geoRes = await routesApi.reverseGeocode(lat, lng)
          if (geoRes.data?.data?.name) {
            stopName = geoRes.data.data.name
          }
        } catch {
          // Fallback name is fine
        }

        // Create stop
        const sequence = stops.length
        const res = await stopsApi.create({
          name: stopName,
          latitude: lat,
          longitude: lng,
          sequence,
          routeId: id
        })

        const newStop = res.data.data as Stop
        setStops(prev => [...prev, newStop])
        showToast(`Added stop: ${stopName}`)
      } catch (error) {
        console.error('Failed to add stop:', error)
        showToast('Failed to add stop', 'error')
      } finally {
        setAddingStop(false)
      }
    },
    [id, isLocked, addingStop, stops.length, showToast]
  )

  // ─── Delete stop ───────────────────────────────────────────────────────────

  const handleDeleteStop = useCallback(
    async (stopId: string) => {
      try {
        await stopsApi.delete(stopId)
        const remaining = stops
          .filter(s => s._id !== stopId)
          .map((s, i) => ({ ...s, sequence: i }))
        setStops(remaining)

        // Reorder remaining stops on server
        if (remaining.length > 0) {
          await stopsApi.reorder(
            remaining.map(s => ({ id: s._id, sequence: s.sequence }))
          )
        }

        // Clear path since stops changed
        setRoutePath([])
        setPathInfo(null)
        showToast('Stop deleted')
      } catch (error) {
        console.error('Failed to delete stop:', error)
        showToast('Failed to delete stop', 'error')
      }
    },
    [stops, showToast]
  )

  // ─── Rename stop ───────────────────────────────────────────────────────────

  const handleStartEdit = useCallback((stop: Stop) => {
    setEditingStopId(stop._id)
    setEditingStopName(stop.name)
  }, [])

  const handleSaveEdit = useCallback(
    async (stopId: string) => {
      if (!editingStopName.trim()) return
      try {
        await stopsApi.update(stopId, { name: editingStopName.trim() })
        setStops(prev =>
          prev.map(s =>
            s._id === stopId ? { ...s, name: editingStopName.trim() } : s
          )
        )
        setEditingStopId(null)
        showToast('Stop renamed')
      } catch (error) {
        console.error('Failed to rename stop:', error)
        showToast('Failed to rename stop', 'error')
      }
    },
    [editingStopName, showToast]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingStopId(null)
    setEditingStopName('')
  }, [])

  // ─── Update estimated time ─────────────────────────────────────────────────

  const handleTimeChange = useCallback(async (stopId: string, time: string) => {
    setStops(prev =>
      prev.map(s =>
        s._id === stopId ? { ...s, estimatedArrivalTime: time } : s
      )
    )
    try {
      await stopsApi.update(stopId, { estimatedArrivalTime: time })
    } catch {
      // Silently handle — time is mostly for display
    }
  }, [])

  // ─── Drag-and-drop reorder ─────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = stops.findIndex(s => s._id === active.id)
      const newIndex = stops.findIndex(s => s._id === over.id)

      const reordered = arrayMove(stops, oldIndex, newIndex).map((s, i) => ({
        ...s,
        sequence: i
      }))

      setStops(reordered)
      setRoutePath([]) // Clear path since order changed
      setPathInfo(null)

      // Persist reorder to server
      setSavingReorder(true)
      try {
        await stopsApi.reorder(
          reordered.map(s => ({ id: s._id, sequence: s.sequence }))
        )
      } catch (error) {
        console.error('Failed to reorder stops:', error)
        showToast('Failed to save reorder', 'error')
      } finally {
        setSavingReorder(false)
      }
    },
    [stops, showToast]
  )

  // ─── Move up/down ──────────────────────────────────────────────────────────

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) return
      const reordered = arrayMove(stops, index, index - 1).map((s, i) => ({
        ...s,
        sequence: i
      }))
      setStops(reordered)
      setRoutePath([])
      setPathInfo(null)

      try {
        await stopsApi.reorder(
          reordered.map(s => ({ id: s._id, sequence: s.sequence }))
        )
      } catch (error) {
        console.error('Failed to reorder:', error)
      }
    },
    [stops]
  )

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= stops.length - 1) return
      const reordered = arrayMove(stops, index, index + 1).map((s, i) => ({
        ...s,
        sequence: i
      }))
      setStops(reordered)
      setRoutePath([])
      setPathInfo(null)

      try {
        await stopsApi.reorder(
          reordered.map(s => ({ id: s._id, sequence: s.sequence }))
        )
      } catch (error) {
        console.error('Failed to reorder:', error)
      }
    },
    [stops]
  )

  // ─── Drag marker to reposition stop ─────────────────────────────────────────

  const handleMarkerDrag = useCallback(
    async (stopId: string, lat: number, lng: number) => {
      // Optimistic update
      setStops(prev =>
        prev.map(s =>
          s._id === stopId ? { ...s, latitude: lat, longitude: lng } : s
        )
      )
      // Clear path since stops moved
      setRoutePath([])
      setPathInfo(null)

      try {
        await stopsApi.update(stopId, { latitude: lat, longitude: lng })
      } catch (error) {
        console.error('Failed to update stop position:', error)
        showToast('Failed to update stop position', 'error')
        // Reload to revert
        loadRoute()
      }
    },
    [showToast, loadRoute]
  )

  // ─── Generate route path (OSRM) ───────────────────────────────────────────

  const handleGeneratePath = useCallback(async () => {
    if (!id || stops.length < 2) return
    setGeneratingPath(true)
    try {
      const res = await routesApi.generatePath(id)
      const data = res.data.data as {
        path: [number, number][]
        distance: number
        duration: number
      }
      setRoutePath(data.path)
      setPathInfo({ distance: data.distance, duration: data.duration })
      showToast(`Path generated: ${data.distance} km, ~${data.duration} min`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      console.error('Failed to generate path:', error)
      showToast(
        err.response?.data?.error || 'Failed to generate route path',
        'error'
      )
    } finally {
      setGeneratingPath(false)
    }
  }, [id, stops.length, showToast])

  // ─── Fit map to stops ──────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current && stops.length > 0) {
      const bounds = L.latLngBounds(
        stops.map(s => [s.latitude, s.longitude] as [number, number])
      )
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [stops.length]) // Only re-fit when stops count changes

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="">
        <Loader2 className="" />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="">
        <RouteIcon className="" />
        <h2 className="">
          Route Not Found
        </h2>
        <button
          onClick={() => navigate('/admin/routes')}
          className=""
        >
          <ArrowLeft className="" />
          Back to Routes
        </button>
      </div>
    )
  }

  // ─── Polyline for straight-line connection (before OSRM path) ──────────────

  const stopPositions: [number, number][] = stops.map(s => [
    s.latitude,
    s.longitude
  ])

  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div className="">
          <button
            onClick={() => navigate('/admin/routes')}
            className=""
            title='Back to routes'
          >
            <ArrowLeft className="" />
          </button>
          <div>
            <h1 className="">
              Route Builder
            </h1>
            <p className="">{route.name}</p>
          </div>
        </div>

        {/* Path generation button */}
        <div className="">
          {pathInfo && (
            <span className="">
              {pathInfo.distance} km • ~{pathInfo.duration} min
            </span>
          )}
          <button
            onClick={handleGeneratePath}
            disabled={stops.length < 2 || generatingPath || isLocked}
            className=""
            title='Generate route path using OSRM'
          >
            {generatingPath ? (
              <Loader2 className="" />
            ) : (
              <Navigation className="" />
            )}
            Generate Path
          </button>
        </div>
      </div>

      {/* Lock banner */}
      {isLocked && (
        <div className="">
          <Lock className="" />
          <span className="">{lockMessage}</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[200] px-6 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all border ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main content: split layout */}
      <div className="">
        {/* Left panel — Stops list */}
        <div className="">
          {/* Panel header */}
          <div className="">
            <div className="">
              <h2 className="">
                <MapPin className="" />
                Stops ({stops.length})
              </h2>
              {savingReorder && (
                <Loader2 className="" />
              )}
            </div>
            {!isLocked && (
              <p className="">
                Click on the map to add stops. Drag to reorder.
              </p>
            )}
          </div>

          {/* Stops list */}
          <div className="">
            {stops.length === 0 ? (
              <div className="">
                <MapPin className="" />
                <p className="">
                  {isLocked
                    ? 'No stops on this route'
                    : 'Click on the map to add your first stop'}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stops.map(s => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stops.map((stop, index) => (
                    <SortableStop
                      key={stop._id}
                      stop={stop}
                      index={index}
                      totalStops={stops.length}
                      isLocked={isLocked}
                      editingStopId={editingStopId}
                      editingStopName={editingStopName}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditNameChange={setEditingStopName}
                      onDelete={handleDeleteStop}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onTimeChange={handleTimeChange}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Panel footer */}
          {stops.length >= 2 && !isLocked && (
            <div className="">
              <button
                onClick={handleGeneratePath}
                disabled={generatingPath}
                className=""
              >
                {generatingPath ? (
                  <Loader2 className="" />
                ) : (
                  <Navigation className="" />
                )}
                Generate Route Path
              </button>
            </div>
          )}
        </div>

        {/* Right — Map */}
        <div className="">
          {addingStop && (
            <div className="">
              <Loader2 className="" />
              Adding stop...
            </div>
          )}

          <div className="">
            <MapContainer
              center={
                stops.length > 0
                  ? [stops[0].latitude, stops[0].longitude]
                  : [31.5204, 74.3587] // Default: Lahore
              }
              zoom={13}
              className=""
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />

              <MapClickHandler
                onMapClick={handleMapClick}
                disabled={isLocked || addingStop}
              />

              {/* Stop markers (draggable when not locked) */}
              {stops.map((stop, index) => (
                <DraggableStopMarker
                  key={stop._id}
                  stop={stop}
                  index={index}
                  totalStops={stops.length}
                  draggable={!isLocked}
                  onDragEnd={handleMarkerDrag}
                />
              ))}

              {/* OSRM route path (road-following) */}
              {routePath.length > 0 && (
                <Polyline
                  positions={routePath}
                  color='#F23B3B'
                  weight={5}
                  opacity={0.8}
                />
              )}

              {/* Fallback: straight line connecting stops (shown when no OSRM path) */}
              {routePath.length === 0 && stopPositions.length >= 2 && (
                <Polyline
                  positions={stopPositions}
                  color='#94a3b8'
                  weight={2}
                  opacity={0.5}
                  dashArray='8 8'
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

