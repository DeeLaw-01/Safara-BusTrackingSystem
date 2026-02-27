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
    <div className="">
      {/* Header */}
      <header className="">
        <button
          title='Back'
          onClick={() => navigate(-1)}
          className=""
        >
          <ArrowLeft className="" />
        </button>
        <h1 className="">Notifications</h1>
      </header>

      <div className="">
        <form onSubmit={handleSubmit} className="">
          {/* Push Notifications */}
          <div className="">
            <div className="">
              <div className="">
                <Smartphone className="" />
              </div>
              <div>
                <h3 className="">
                  Push Notifications
                </h3>
                <p className="">
                  Receive notifications on your device
                </p>
              </div>
            </div>

            <div className="">
              <label className="">
                <div>
                  <p className="">
                    Enable Push Notifications
                  </p>
                  <p className="">
                    Receive real-time updates on your device
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.pushNotifications}
                  onChange={() => toggleSetting('pushNotifications')}
                  className=""
                />
              </label>

              <label className="">
                <div>
                  <p className="">
                    Bus Approaching
                  </p>
                  <p className="">
                    Get notified when your bus is nearby
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.busApproaching}
                  onChange={() => toggleSetting('busApproaching')}
                  disabled={!settings.pushNotifications}
                  className=""
                />
              </label>

              <label className="">
                <div>
                  <p className="">
                    Route Updates
                  </p>
                  <p className="">
                    Notifications about route changes or delays
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.routeUpdates}
                  onChange={() => toggleSetting('routeUpdates')}
                  disabled={!settings.pushNotifications}
                  className=""
                />
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="">
            <div className="">
              <div className="">
                <Mail className="" />
              </div>
              <div>
                <h3 className="">
                  Email Notifications
                </h3>
                <p className="">
                  Receive updates via email
                </p>
              </div>
            </div>

            <div className="">
              <label className="">
                <div>
                  <p className="">
                    Enable Email Notifications
                  </p>
                  <p className="">
                    Receive updates in your inbox
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.emailNotifications}
                  onChange={() => toggleSetting('emailNotifications')}
                  className=""
                />
              </label>

              <label className="">
                <div>
                  <p className="">
                    System Announcements
                  </p>
                  <p className="">
                    Important updates and announcements
                  </p>
                </div>
                <input
                  type='checkbox'
                  checked={settings.systemAnnouncements}
                  onChange={() => toggleSetting('systemAnnouncements')}
                  disabled={!settings.emailNotifications}
                  className=""
                />
              </label>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="">
              <Check className="" />
              <span className="">
                Notification preferences saved!
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="">
            <button
              type='button'
              title='Cancel'
              onClick={() => navigate(-1)}
              className=""
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className=""
            >
              {loading ? (
                <>
                  <Loader2 className="" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="" />
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

