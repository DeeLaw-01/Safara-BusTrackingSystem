import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Shield, Calendar, Settings, Bell, ChevronRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

export default function MyAccount () {
  const navigate = useNavigate()
  const { user } = useAuthStore()

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
        <h1 className='text-lg font-semibold font-bold text-stone-800'>My Account</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6 space-y-5'>

        {/* ── Profile Hero ── */}
        <div className='relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 pt-8 text-white overflow-hidden animated-gradient'>
          {/* Digital grid overlay */}
          <div className='absolute inset-0 opacity-10'
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          {/* Decorative circles */}
          <div className='absolute -top-8 -right-8 w-32 h-32 border border-white/10 rounded-full' />
          <div className='absolute -bottom-12 -left-12 w-40 h-40 border border-white/5 rounded-full' />
          <div className='absolute top-2 right-16 float-particle'>
            <Sparkles className='w-5 h-5 text-white/10' />
          </div>

          <div className='relative z-10 flex flex-col items-center text-center'>
            <div className='mb-3'>
              <UserAvatar
                name={user?.name}
                avatar={user?.avatar}
                size='xl'
                className='ring-4 ring-white/30 shadow-lg'
              />
            </div>
            <h2 className='text-xl font-bold mb-0.5'>{user?.name}</h2>
            <p className='text-white/70 text-sm mb-2'>{user?.email}</p>
            <span className='inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full capitalize'>
              <Shield className='w-3 h-3' />
              {user?.role}
            </span>
          </div>

          <button
            title='Edit Profile'
            onClick={() => navigate('/settings')}
            className='relative z-10 mt-5 w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10'
          >
            Edit Profile
          </button>
        </div>

        {/* ── Account Details ── */}
        <div className='bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden'>
          <div className='px-5 py-4 border-b border-stone-100'>
            <h3 className='text-sm font-semibold text-stone-800'>Account Details</h3>
          </div>

          <div className='divide-y divide-stone-100'>
            <DetailRow icon={Mail} label='Email' value={user?.email || 'N/A'} />
            {user?.phone && <DetailRow icon={Phone} label='Phone' value={user.phone} />}
            <DetailRow
              icon={Shield}
              label='Account Status'
              value={user?.isEmailVerified ? 'Verified' : 'Unverified'}
              valueColor={user?.isEmailVerified ? 'text-orange-600' : 'text-amber-600'}
            />
            <DetailRow
              icon={Calendar}
              label='Member Since'
              value={user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })
                : 'N/A'
              }
            />
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className='bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden'>
          <div className='px-5 py-4 border-b border-stone-100'>
            <h3 className='text-sm font-semibold text-stone-800'>Quick Actions</h3>
          </div>

          <div className='divide-y divide-stone-100'>
            <ActionRow icon={Settings} label='Settings' desc='Manage your account settings'
              onClick={() => navigate('/settings')} />
            <ActionRow icon={Bell} label='Notifications' desc='Configure notification preferences'
              onClick={() => navigate('/notifications')} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow ({ icon: Icon, label, value, valueColor }:
  { icon: React.ElementType; label: string; value: string; valueColor?: string }) {
  return (
    <div className='flex items-center gap-4 px-5 py-3.5'>
      <div className='w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0'>
        <Icon className='w-4 h-4 text-stone-400' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs text-stone-400 mb-0.5'>{label}</p>
        <p className={`text-sm font-medium truncate ${valueColor || 'text-stone-700'}`}>{value}</p>
      </div>
    </div>
  )
}

function ActionRow ({ icon: Icon, label, desc, onClick }:
  { icon: React.ElementType; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className='w-full flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors text-left'
    >
      <div className='w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0'>
        <Icon className='w-4 h-4 text-amber-600' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-stone-700'>{label}</p>
        <p className='text-xs text-stone-400'>{desc}</p>
      </div>
      <ChevronRight className='w-4 h-4 text-stone-300' />
    </button>
  )
}
