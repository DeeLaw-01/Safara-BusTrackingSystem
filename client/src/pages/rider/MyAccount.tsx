import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Shield, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function MyAccount () {
  const navigate = useNavigate()
  const { user } = useAuthStore()

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
        <h1 className="">My Account</h1>
      </header>

      <div className="">
        {/* Profile Card */}
        <div className="">
          <div className="">
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size='xl'
              className=""
            />
            <div>
              <h2 className="">{user?.name}</h2>
              <p className="">{user?.email}</p>
              <span className="">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            title='Edit Profile'
            onClick={() => navigate('/settings')}
            className=""
          >
            Edit Profile
          </button>
        </div>

        {/* Account Details */}
        <div className="">
          <h3 className="">
            Account Details
          </h3>

          <div className="">
            <div className="">
              <Mail className="" />
              <div className="">
                <p className="">Email</p>
                <p className="">
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className="">
                <Phone className="" />
                <div className="">
                  <p className="">Phone</p>
                  <p className="">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="">
              <Shield className="" />
              <div className="">
                <p className="">Account Status</p>
                <p className="">
                  {user?.isEmailVerified ? (
                    <span className="">Verified</span>
                  ) : (
                    <span className="">Unverified</span>
                  )}
                </p>
              </div>
            </div>

            <div className="">
              <Calendar className="" />
              <div className="">
                <p className="">Member Since</p>
                <p className="">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="">
          <h3 className="">
            Quick Actions
          </h3>

          <div className="">
            <button
              title='Settings'
              onClick={() => navigate('/settings')}
              className=""
            >
              <p className="">Settings</p>
              <p className="">
                Manage your account settings
              </p>
            </button>

            <button
              title='Notifications'
              onClick={() => navigate('/notifications')}
              className=""
            >
              <p className="">Notifications</p>
              <p className="">
                Configure notification preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

