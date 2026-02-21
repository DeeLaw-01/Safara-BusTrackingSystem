import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Smartphone,
  Mail,
  Save,
  Loader2,
  Check
} from 'lucide-react'

export default function Notifications () {
  const navigate = useNavigate()

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    busApproaching: true,
    routeUpdates: true,
    systemAnnouncements: false
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    // TODO: Save to backend
    await new Promise(resolve => setTimeout(resolve, 1000))

    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-50'>
        <button
          title='Back'
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-gray-700' />
        </button>
        <h1 className='text-lg font-bold text-gray-900'>Notifications</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Push Notifications */}
          <div className='bg-white rounded-2xl border border-gray-100 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-primary-100 rounded-lg'>
                <Smartphone className='w-5 h-5 text-primary-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Push Notifications
                </h3>
                <p className='text-sm text-gray-500'>
                  Receive notifications on your device
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    Enable Push Notifications
                  </p>
                  <p className='text-xs text-gray-500'>
                    Receive real-time updates on your device
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting('pushNotifications')}
                  className='w-5 h-5 text-coral-500 rounded focus:ring-coral-500'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    Bus Approaching
                  </p>
                  <p className='text-xs text-gray-500'>
                    Get notified when your bus is nearby
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.busApproaching}
                  onChange={() => toggleSetting('busApproaching')}
                  disabled={!settings.pushNotifications}
                  className='w-5 h-5 text-coral-500 rounded focus:ring-coral-500 disabled:opacity-50'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    Route Updates
                  </p>
                  <p className='text-xs text-gray-500'>
                    Notifications about route changes or delays
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.routeUpdates}
                  onChange={() => toggleSetting('routeUpdates')}
                  disabled={!settings.pushNotifications}
                  className='w-5 h-5 text-coral-500 rounded focus:ring-coral-500 disabled:opacity-50'
                />
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className='bg-white rounded-2xl border border-gray-100 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-coral-100 rounded-lg'>
                <Mail className='w-5 h-5 text-coral-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Email Notifications
                </h3>
                <p className='text-sm text-gray-500'>
                  Receive updates via email
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    Enable Email Notifications
                  </p>
                  <p className='text-xs text-gray-500'>
                    Receive updates in your inbox
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting('emailNotifications')}
                  className='w-5 h-5 text-coral-500 rounded focus:ring-coral-500'
                />
              </label>

              <label className='flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    System Announcements
                  </p>
                  <p className='text-xs text-gray-500'>
                    Important updates and announcements
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.systemAnnouncements}
                  onChange={() => toggleSetting('systemAnnouncements')}
                  disabled={!settings.emailNotifications}
                  className='w-5 h-5 text-coral-500 rounded focus:ring-coral-500 disabled:opacity-50'
                />
              </label>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className='flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700'>
              <Check className='w-5 h-5' />
              <span className='text-sm font-medium'>
                Notification preferences saved!
              </span>
            </div>
          )}

          {/* Submit Button */}
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
              className='btn btn-coral flex-1'
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
