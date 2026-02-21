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
        <div className='text-sm'>
          <div className='font-semibold'>{stop.name}</div>
          <div className='text-slate-500 text-xs mt-1'>
            Stop #{index + 1}
            {draggable && ' • Drag to reposition'}
          </div>
          {stop.estimatedArrivalTime && (
            <div className='text-xs text-slate-500'>
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
    : 'bg-primary-500'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
        isDragging
          ? 'bg-slate-700 border-primary-500'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Drag handle */}
      {!isLocked && (
        <button
          {...attributes}
          {...listeners}
          className='mt-1 p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing'
          title='Drag to reorder'
        >
          <GripVertical className='w-4 h-4' />
        </button>
      )}

      {/* Number badge */}
      <div
        className={`mt-0.5 w-7 h-7 rounded-full ${markerColor} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      >
        {index + 1}
      </div>

      {/* Stop info */}
      <div className='flex-1 min-w-0'>
        {isEditing ? (
          <div className='flex items-center gap-1'>
            <input
              type='text'
              value={editingStopName}
              onChange={e => onEditNameChange(e.target.value)}
              className='input text-sm py-1 px-2'
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
              className='p-1 text-green-400 hover:text-green-300'
              title='Save'
            >
              <Check className='w-4 h-4' />
            </button>
            <button
              onClick={onCancelEdit}
              className='p-1 text-slate-400 hover:text-slate-300'
              title='Cancel'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-1'>
            <span className='text-sm font-medium text-white truncate'>
              {stop.name}
            </span>
            {!isLocked && (
              <button
                onClick={() => onStartEdit(stop)}
                className='p-0.5 text-slate-500 hover:text-slate-300'
                title='Rename stop'
              >
                <Pencil className='w-3 h-3' />
              </button>
            )}
          </div>
        )}
        <div className='text-xs text-slate-500 mt-0.5'>
          {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
        </div>

        {/* Estimated time */}
        <div className='flex items-center gap-1 mt-1'>
          <Clock className='w-3 h-3 text-slate-500' />
          <label className='sr-only' htmlFor={`time-${stop._id}`}>
            Estimated arrival time
          </label>
          <input
            id={`time-${stop._id}`}
            type='time'
            value={stop.estimatedArrivalTime || ''}
            onChange={e => onTimeChange(stop._id, e.target.value)}
            disabled={isLocked}
            className='text-xs bg-transparent text-slate-400 border-none outline-none p-0'
            title='Estimated arrival time'
            placeholder='HH:MM'
          />
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className='p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'
            title='Move up'
          >
            <ChevronUp className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalStops - 1}
            className='p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'
            title='Move down'
          >
            <ChevronDown className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => onDelete(stop._id)}
            className='p-1 text-red-400 hover:text-red-300'
            title='Delete stop'
          >
            <Trash2 className='w-3.5 h-3.5' />
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
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='w-8 h-8 text-primary-500 animate-spin' />
      </div>
    )
  }

  if (!route) {
    return (
      <div className='text-center py-20'>
        <RouteIcon className='w-12 h-12 text-slate-600 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-white mb-2'>
          Route Not Found
        </h2>
        <button
          onClick={() => navigate('/admin/routes')}
          className='btn btn-secondary mt-4'
        >
          <ArrowLeft className='w-4 h-4' />
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
    <div className='h-[calc(100vh-8rem)] flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/admin/routes')}
            className='p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg'
            title='Back to routes'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-xl font-display font-bold text-white'>
              Route Builder
            </h1>
            <p className='text-sm text-slate-400'>{route.name}</p>
          </div>
        </div>

        {/* Path generation button */}
        <div className='flex items-center gap-3'>
          {pathInfo && (
            <span className='text-sm text-slate-400'>
              {pathInfo.distance} km • ~{pathInfo.duration} min
            </span>
          )}
          <button
            onClick={handleGeneratePath}
            disabled={stops.length < 2 || generatingPath || isLocked}
            className='btn btn-primary text-sm'
            title='Generate route path using OSRM'
          >
            {generatingPath ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Navigation className='w-4 h-4' />
            )}
            Generate Path
          </button>
        </div>
      </div>

      {/* Lock banner */}
      {isLocked && (
        <div className='flex items-center gap-2 bg-amber-600/20 border border-amber-600/40 text-amber-400 px-4 py-3 rounded-lg mb-4 flex-shrink-0'>
          <Lock className='w-5 h-5 flex-shrink-0' />
          <span className='text-sm font-medium'>{lockMessage}</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main content: split layout */}
      <div className='flex-1 flex gap-4 min-h-0'>
        {/* Left panel — Stops list */}
        <div className='w-80 flex-shrink-0 flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden'>
          {/* Panel header */}
          <div className='p-4 border-b border-slate-800'>
            <div className='flex items-center justify-between'>
              <h2 className='text-sm font-semibold text-white flex items-center gap-2'>
                <MapPin className='w-4 h-4 text-primary-400' />
                Stops ({stops.length})
              </h2>
              {savingReorder && (
                <Loader2 className='w-4 h-4 text-primary-400 animate-spin' />
              )}
            </div>
            {!isLocked && (
              <p className='text-xs text-slate-500 mt-1'>
                Click on the map to add stops. Drag to reorder.
              </p>
            )}
          </div>

          {/* Stops list */}
          <div className='flex-1 overflow-y-auto p-3 space-y-2'>
            {stops.length === 0 ? (
              <div className='text-center py-8'>
                <MapPin className='w-8 h-8 text-slate-600 mx-auto mb-3' />
                <p className='text-sm text-slate-500'>
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
            <div className='p-3 border-t border-slate-800'>
              <button
                onClick={handleGeneratePath}
                disabled={generatingPath}
                className='btn btn-primary w-full text-sm'
              >
                {generatingPath ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Navigation className='w-4 h-4' />
                )}
                Generate Route Path
              </button>
            </div>
          )}
        </div>

        {/* Right — Map */}
        <div className='flex-1 rounded-xl overflow-hidden border border-slate-800 relative'>
          {addingStop && (
            <div className='absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2'>
              <Loader2 className='w-4 h-4 animate-spin' />
              Adding stop...
            </div>
          )}

          <div className='leaflet-dark h-full'>
            <MapContainer
              center={
                stops.length > 0
                  ? [stops[0].latitude, stops[0].longitude]
                  : [31.5204, 74.3587] // Default: Lahore
              }
              zoom={13}
              className='h-full w-full'
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
                  color='#0ea5e9'
                  weight={4}
                  opacity={0.8}
                />
              )}

              {/* Fallback: straight line connecting stops (shown when no OSRM path) */}
              {routePath.length === 0 && stopPositions.length >= 2 && (
                <Polyline
                  positions={stopPositions}
                  color='#64748b'
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
