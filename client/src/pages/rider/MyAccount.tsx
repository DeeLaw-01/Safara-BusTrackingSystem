import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Shield, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function MyAccount () {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='page-header'>
        <button
          title='Back'
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-slate-800' />
        </button>
        <h1 className='text-lg font-semibold font-bold text-slate-800'>My Account</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6 space-y-5'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <div className='flex items-center gap-4 mb-6'>
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size='xl'
              className='ring-4 ring-teal-500/10'
            />
            <div>
              <h2 className='text-xl font-semibold font-bold text-slate-800'>{user?.name}</h2>
              <p className='text-sm text-slate-500'>{user?.email}</p>
              <span className='badge badge-primary mt-2 capitalize'>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            title='Edit Profile'
            onClick={() => navigate('/settings')}
            className='w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors'
          >
            Edit Profile
          </button>
        </div>

        {/* Account Details */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <h3 className='text-base font-semibold text-slate-800 mb-4'>
            Account Details
          </h3>

          <div className='space-y-3'>
            <div className='flex items-center gap-4 p-3 bg-slate-50 rounded-xl'>
              <Mail className='w-5 h-5 text-slate-400' />
              <div className='flex-1'>
                <p className='text-xs text-slate-500 mb-0.5'>Email</p>
                <p className='text-sm font-medium text-slate-800'>
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className='flex items-center gap-4 p-3 bg-slate-50 rounded-xl'>
                <Phone className='w-5 h-5 text-slate-400' />
                <div className='flex-1'>
                  <p className='text-xs text-slate-500 mb-0.5'>Phone</p>
                  <p className='text-sm font-medium text-slate-800'>
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            <div className='flex items-center gap-4 p-3 bg-slate-50 rounded-xl'>
              <Shield className='w-5 h-5 text-slate-400' />
              <div className='flex-1'>
                <p className='text-xs text-slate-500 mb-0.5'>Account Status</p>
                <p className='text-sm font-medium text-slate-800'>
                  {user?.isEmailVerified ? (
                    <span className='text-emerald-600'>Verified</span>
                  ) : (
                    <span className='text-amber-600 font-semibold'>Unverified</span>
                  )}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4 p-3 bg-slate-50 rounded-xl'>
              <Calendar className='w-5 h-5 text-slate-400' />
              <div className='flex-1'>
                <p className='text-xs text-slate-500 mb-0.5'>Member Since</p>
                <p className='text-sm font-medium text-slate-800'>
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
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <h3 className='text-base font-semibold text-slate-800 mb-4'>
            Quick Actions
          </h3>

          <div className='space-y-2'>
            <button
              title='Settings'
              onClick={() => navigate('/settings')}
              className='w-full text-left p-3 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <p className='text-sm font-medium text-slate-800'>Settings</p>
              <p className='text-xs text-slate-500'>
                Manage your account settings
              </p>
            </button>

            <button
              title='Notifications'
              onClick={() => navigate('/notifications')}
              className='w-full text-left p-3 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <p className='text-sm font-medium text-slate-800'>Notifications</p>
              <p className='text-xs text-slate-500'>
                Configure notification preferences
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
