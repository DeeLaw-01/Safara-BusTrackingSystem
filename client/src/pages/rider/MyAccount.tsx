import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Shield, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function MyAccount () {
  const navigate = useNavigate()
  const { user } = useAuthStore()

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
        <h1 className='text-lg font-bold text-gray-900'>My Account</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <div className='flex items-center gap-4 mb-6'>
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size='xl'
              className='ring-4 ring-coral-100'
            />
            <div>
              <h2 className='text-xl font-bold text-gray-900'>{user?.name}</h2>
              <p className='text-sm text-gray-500'>{user?.email}</p>
              <span className='inline-block mt-2 text-xs font-medium text-coral-600 bg-coral-50 px-2.5 py-0.5 rounded-full capitalize'>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            title='Edit Profile'
            onClick={() => navigate('/settings')}
            className='w-full btn btn-coral'
          >
            Edit Profile
          </button>
        </div>

        {/* Account Details */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Account Details
          </h3>

          <div className='space-y-4'>
            <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
              <Mail className='w-5 h-5 text-gray-400' />
              <div className='flex-1'>
                <p className='text-xs text-gray-500 mb-0.5'>Email</p>
                <p className='text-sm font-medium text-gray-900'>
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
                <Phone className='w-5 h-5 text-gray-400' />
                <div className='flex-1'>
                  <p className='text-xs text-gray-500 mb-0.5'>Phone</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
              <Shield className='w-5 h-5 text-gray-400' />
              <div className='flex-1'>
                <p className='text-xs text-gray-500 mb-0.5'>Account Status</p>
                <p className='text-sm font-medium text-gray-900'>
                  {user?.isEmailVerified ? (
                    <span className='text-green-600'>Verified</span>
                  ) : (
                    <span className='text-amber-600'>Unverified</span>
                  )}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
              <Calendar className='w-5 h-5 text-gray-400' />
              <div className='flex-1'>
                <p className='text-xs text-gray-500 mb-0.5'>Member Since</p>
                <p className='text-sm font-medium text-gray-900'>
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
        <div className='bg-white rounded-2xl border border-gray-100 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Quick Actions
          </h3>

          <div className='space-y-2'>
            <button
              title='Settings'
              onClick={() => navigate('/settings')}
              className='w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <p className='text-sm font-medium text-gray-900'>Settings</p>
              <p className='text-xs text-gray-500'>
                Manage your account settings
              </p>
            </button>

            <button
              title='Notifications'
              onClick={() => navigate('/notifications')}
              className='w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <p className='text-sm font-medium text-gray-900'>Notifications</p>
              <p className='text-xs text-gray-500'>
                Configure notification preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
