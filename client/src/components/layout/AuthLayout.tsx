import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'
import { Bus, MapPin, Navigation, Shield } from 'lucide-react'

export default function AuthLayout () {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [isSuccessExit, setIsSuccessExit] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user && !isSuccessExit) {
      setIsSuccessExit(true)
    }
  }, [isAuthenticated, user, isSuccessExit])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin' />
      </div>
    )
  }

  if (isAuthenticated && user && isSuccessExit) {
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/'
    }, 600)
  }

  return (
    <div className='min-h-screen flex bg-white'>

      {/* ═══ LEFT PANEL — brand / illustration (desktop only) ═══ */}
      <div className='hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden'>
        {/* Digital grid */}
        <div className='absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Animated gradient accent */}
        <div className='absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-teal-500/20 to-transparent animated-gradient' />

        {/* Decorative circles */}
        <div className='absolute -top-20 -right-20 w-80 h-80 border border-white/5 rounded-full' />
        <div className='absolute top-40 -left-16 w-64 h-64 border border-teal-500/10 rounded-full' />
        <div className='absolute bottom-20 right-10 w-40 h-40 bg-teal-500/5 rounded-full float-particle' />

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12 w-full'>
          {/* Logo */}
          <div className='flex items-center gap-3 mb-12'>
            <div className='w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25'>
              <Bus className='w-6 h-6 text-white' />
            </div>
            <div>
              <span className='text-2xl font-bold text-white tracking-tight'>Safara</span>
              <p className='text-xs text-slate-400 -mt-0.5'>Bus Tracking System</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className='text-3xl xl:text-4xl font-bold text-white leading-tight mb-4 glitch-text' data-text='Track your bus in real-time'>
            Track your bus
            <br />
            in <span className='text-teal-400'>real-time</span>
          </h1>
          <p className='text-slate-400 text-sm leading-relaxed max-w-sm mb-10'>
            Stay connected with your campus bus. Get live locations, ETAs, and route updates — all in one app.
          </p>

          {/* Feature pills */}
          <div className='space-y-3'>
            {[
              { icon: MapPin, text: 'Live GPS tracking' },
              { icon: Navigation, text: 'Real-time ETAs' },
              { icon: Shield, text: 'Route notifications' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className='flex items-center gap-3 text-sm text-slate-300 animate-fade-in-up' style={{ animationDelay: `${i * 150}ms` }}>
                <div className='w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10'>
                  <Icon className='w-4 h-4 text-teal-400' />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — auth form ═══ */}
      <div className='flex-1 flex flex-col min-h-screen relative bg-slate-50'>

        {/* Mobile logo */}
        <div className='lg:hidden flex justify-center pt-10 pb-4'>
          <div className={`flex items-center gap-3 transition-all duration-700 ${
            isSuccessExit ? 'opacity-0 scale-95 -translate-y-5' : ''
          }`}>
            <div className='w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20'>
              <Bus className='w-5 h-5 text-white' />
            </div>
            <span className='text-xl font-bold text-slate-800 tracking-tight'>Safara</span>
          </div>
        </div>

        {/* Form area */}
        <div className='flex-1 flex items-center justify-center px-6 py-8'>
          <div className={`w-full max-w-md transition-all duration-700 ease-in-out ${
            isSuccessExit ? 'translate-y-8 opacity-0 scale-95' : ''
          }`}>
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-8'>
              <Outlet />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center py-4 text-xs text-slate-400'>
          © {new Date().getFullYear()} Safara · Bus Tracking System
        </div>
      </div>
    </div>
  )
}
