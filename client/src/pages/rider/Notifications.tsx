import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Smartphone,
  Mail,
  Save,
  Loader2,
  Check
} from 'lucide-react'

export default function Notifications () {
  const navigate = useNavigate()

  const STORAGE_KEY = 'safara_notification_settings'

  const defaultSettings = {
    pushNotifications: true,
    emailNotifications: true,
    busApproaching: true,
    routeUpdates: true,
    systemAnnouncements: false
  }

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      // Small delay so the loader is briefly visible for feedback
      await new Promise(resolve => setTimeout(resolve, 400))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = (key: keyof typeof defaultSettings) => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, [key]: !prev[key] }))
  }

  // Toggle component
  const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      type='button'
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-amber-600' : 'bg-stone-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
      }`} />
    </button>
  )

  return (
    <div className='min-h-screen bg-stone-50'>
      {/* Header */}
      <header className='page-header'>
        <button
          title='Back'
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-stone-100 rounded-xl transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-stone-800' />
        </button>
        <h1 className='text-lg font-semibold font-bold text-stone-800'>Notifications</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Push Notifications */}
          <div className='bg-white rounded-2xl border border-stone-200 shadow-sm p-5'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='info-stat-icon bg-amber-50'>
                <Smartphone className='w-5 h-5 text-amber-600' />
              </div>
              <div>
                <h3 className='text-base font-semibold text-stone-800'>
                  Push Notifications
                </h3>
                <p className='text-sm text-stone-500'>
                  Receive notifications on your device
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-stone-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-stone-800'>
                    Enable Push Notifications
                  </p>
                  <p className='text-xs text-stone-500'>
                    Receive real-time updates on your device
                  </p>
                </div>
                <Toggle checked={settings.pushNotifications} onChange={() => toggleSetting('pushNotifications')} />
              </div>

              <div className='flex items-center justify-between p-3 bg-stone-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-stone-800'>
                    Bus Approaching
                  </p>
                  <p className='text-xs text-stone-500'>
                    Get notified when your bus is nearby
                  </p>
                </div>
                <Toggle checked={settings.busApproaching} onChange={() => toggleSetting('busApproaching')} disabled={!settings.pushNotifications} />
              </div>

              <div className='flex items-center justify-between p-3 bg-stone-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-stone-800'>
                    Route Updates
                  </p>
                  <p className='text-xs text-stone-500'>
                    Notifications about route changes or delays
                  </p>
                </div>
                <Toggle checked={settings.routeUpdates} onChange={() => toggleSetting('routeUpdates')} disabled={!settings.pushNotifications} />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className='bg-white rounded-2xl border border-stone-200 shadow-sm p-5'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='info-stat-icon bg-amber-50'>
                <Mail className='w-5 h-5 text-amber-600' />
              </div>
              <div>
                <h3 className='text-base font-semibold text-stone-800'>
                  Email Notifications
                </h3>
                <p className='text-sm text-stone-500'>
                  Receive updates via email
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-stone-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-stone-800'>
                    Enable Email Notifications
                  </p>
                  <p className='text-xs text-stone-500'>
                    Receive updates in your inbox
                  </p>
                </div>
                <Toggle checked={settings.emailNotifications} onChange={() => toggleSetting('emailNotifications')} />
              </div>

              <div className='flex items-center justify-between p-3 bg-stone-50 rounded-xl'>
                <div>
                  <p className='text-sm font-medium text-stone-800'>
                    System Announcements
                  </p>
                  <p className='text-xs text-stone-500'>
                    Important updates and announcements
                  </p>
                </div>
                <Toggle checked={settings.systemAnnouncements} onChange={() => toggleSetting('systemAnnouncements')} disabled={!settings.emailNotifications} />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className='flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700'>
              <Check className='w-5 h-5' />
              <span className='text-sm font-medium'>
                Notification preferences saved!
              </span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className='flex gap-3'>
            <button
              type='button'
              title='Cancel'
              onClick={() => navigate(-1)}
              className='btn btn-secondary flex-1'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='btn btn-primary flex-1'
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
