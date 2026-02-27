import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Route as RouteIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Map
} from 'lucide-react'
import { routesApi, stopsApi } from '@/services/api'
import type { Route, Stop } from '@/types'

export default function ManageRoutes () {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<
    string | null
  >(null)

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const { data } = await routesApi.getAll()
      setRoutes(data.data)
    } catch (error) {
      console.error('Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (
      !confirm('Are you sure? This will also delete all stops on this route.')
    )
      return
    try {
      await routesApi.delete(id)
      loadRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
    }
  }

  const handleDeleteStop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stop?')) return
    try {
      await stopsApi.delete(id)
      loadRoutes()
    } catch (error) {
      console.error('Failed to delete stop:', error)
    }
  }

  if (loading) {
    return (
      <div className="">
        <Loader2 className="" />
      </div>
    )
  }

  return (
    <div className="">
      <div className="">
        <h1 className="">
          Manage Routes
        </h1>
        <button
          onClick={() => {
            setEditingRoute(null)
            setShowRouteModal(true)
          }}
          className=""
        >
          <Plus className="" />
          Add Route
        </button>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="">
          <RouteIcon className="" />
          <h3 className="">
            No Routes Yet
          </h3>
          <p className="">
            Create your first route to get started
          </p>
          <button onClick={() => setShowRouteModal(true)} className="">
            <Plus className="" />
            Create Route
          </button>
        </div>
      ) : (
        <div className="">
          {routes.map(route => (
            <div key={route._id} className="">
              {/* Route Header */}
              <div
                className=""
                onClick={() =>
                  setExpandedRoute(
                    expandedRoute === route._id ? null : route._id
                  )
                }
              >
                <div className="">
                  <div
                    className={`p-2 rounded-lg ${
                      route.isActive ? 'bg-green-50' : 'bg-app-bg'
                    }`}
                  >
                    <RouteIcon
                      className={`w-5 h-5 ${
                        route.isActive
                          ? 'text-green-600'
                          : 'text-content-secondary'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="">
                      {route.name}
                    </h3>
                    <p className="">
                      {route.stops?.length || 0} stops •{' '}
                      {route.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div className="">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/admin/routes/builder/${route._id}`)
                    }}
                    className=""
                    title='Open Route Builder'
                  >
                    <Map className="" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setEditingRoute(route)
                      setShowRouteModal(true)
                    }}
                    className=""
                  >
                    <Edit className="" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteRoute(route._id)
                    }}
                    className=""
                  >
                    <Trash2 className="" />
                  </button>
                  {expandedRoute === route._id ? (
                    <ChevronUp className="" />
                  ) : (
                    <ChevronDown className="" />
                  )}
                </div>
              </div>

              {/* Expanded Stops */}
              {expandedRoute === route._id && (
                <div className="">
                  <div className="">
                    <h4 className="">
                      Stops
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedRouteForStop(route._id)
                        setEditingStop(null)
                        setShowStopModal(true)
                      }}
                      className=""
                    >
                      <Plus className="" />
                      Add Stop
                    </button>
                  </div>

                  {!route.stops || route.stops.length === 0 ? (
                    <p className="">
                      No stops added yet
                    </p>
                  ) : (
                    <div className="">
                      {route.stops.map((stop, index) => (
                        <div
                          key={stop._id}
                          className=""
                        >
                          <div className="">
                            <div className="">
                              {index + 1}
                            </div>
                            <div>
                              <div className="">
                                {stop.name}
                              </div>
                              <div className="">
                                {stop.latitude.toFixed(4)},{' '}
                                {stop.longitude.toFixed(4)}
                              </div>
                            </div>
                          </div>
                          <div className="">
                            <button
                              onClick={() => {
                                setSelectedRouteForStop(route._id)
                                setEditingStop(stop)
                                setShowStopModal(true)
                              }}
                              className=""
                            >
                              <Edit className="" />
                            </button>
                            <button
                              onClick={() => handleDeleteStop(stop._id)}
                              className=""
                            >
                              <Trash2 className="" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <RouteModal
          route={editingRoute}
          onClose={() => setShowRouteModal(false)}
          onSuccess={() => {
            setShowRouteModal(false)
            loadRoutes()
          }}
        />
      )}

      {/* Stop Modal */}
      {showStopModal && selectedRouteForStop && (
        <StopModal
          routeId={selectedRouteForStop}
          stop={editingStop}
          existingStopsCount={
            routes.find(r => r._id === selectedRouteForStop)?.stops?.length || 0
          }
          onClose={() => setShowStopModal(false)}
          onSuccess={() => {
            setShowStopModal(false)
            loadRoutes()
          }}
        />
      )}
    </div>
  )
}

interface RouteModalProps {
  route: Route | null
  onClose: () => void
  onSuccess: () => void
}

function RouteModal ({ route, onClose, onSuccess }: RouteModalProps) {
  const [name, setName] = useState(route?.name || '')
  const [description, setDescription] = useState(route?.description || '')
  const [isActive, setIsActive] = useState(route?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (route) {
        await routesApi.update(route._id, { name, description, isActive })
      } else {
        await routesApi.create({ name, description })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save route:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="">
      <div className="">
        <h2 className="">
          {route ? 'Edit Route' : 'Create Route'}
        </h2>
        <form onSubmit={handleSubmit} className="">
          <div>
            <label className="">
              Route Name
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className=""
              placeholder='e.g., DHA Phase 5 - Model Town'
              required
            />
          </div>
          <div>
            <label className="">
              Description (Optional)
            </label>
            <input
              type='text'
              value={description}
              onChange={e => setDescription(e.target.value)}
              className=""
              placeholder='e.g., Morning route via main boulevard'
            />
          </div>
          {route && (
            <div>
              <label className="">
                <input
                  type='checkbox'
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className=""
                />
                <span className="">
                  Route is active
                </span>
              </label>
            </div>
          )}
          <div className="">
            <button
              type='button'
              onClick={onClose}
              className=""
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className=""
            >
              {saving ? <Loader2 className="" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StopModalProps {
  routeId: string
  stop: Stop | null
  existingStopsCount: number
  onClose: () => void
  onSuccess: () => void
}

function StopModal ({
  routeId,
  stop,
  existingStopsCount,
  onClose,
  onSuccess
}: StopModalProps) {
  const [name, setName] = useState(stop?.name || '')
  const [latitude, setLatitude] = useState(stop?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(stop?.longitude?.toString() || '')
  const [sequence, setSequence] = useState(
    stop?.sequence?.toString() || existingStopsCount.toString()
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (stop) {
        await stopsApi.update(stop._id, {
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence)
        })
      } else {
        await stopsApi.create({
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          sequence: parseInt(sequence),
          routeId
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save stop:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="">
      <div className="">
        <h2 className="">
          {stop ? 'Edit Stop' : 'Add Stop'}
        </h2>
        <form onSubmit={handleSubmit} className="">
          <div>
            <label className="">
              Stop Name
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className=""
              placeholder='e.g., Main Gate'
              required
            />
          </div>
          <div className="">
            <div>
              <label className="">
                Latitude
              </label>
              <input
                type='number'
                step='any'
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                className=""
                placeholder='31.5204'
                required
              />
            </div>
            <div>
              <label className="">
                Longitude
              </label>
              <input
                type='number'
                step='any'
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                className=""
                placeholder='74.3587'
                required
              />
            </div>
          </div>
          <div>
            <label className="">
              Sequence (Order)
            </label>
            <input
              type='number'
              min='0'
              value={sequence}
              onChange={e => setSequence(e.target.value)}
              className=""
              required
            />
          </div>
          <div className="">
            <button
              type='button'
              onClick={onClose}
              className=""
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className=""
            >
              {saving ? <Loader2 className="" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

