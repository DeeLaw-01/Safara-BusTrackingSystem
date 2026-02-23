import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'
import { useState, useEffect } from 'react'

export default function AuthLayout () {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const [isSuccessExit, setIsSuccessExit] = useState(false)

  // Handle successful login animation
  useEffect(() => {
    if (isAuthenticated && user && !isSuccessExit) {
      setIsSuccessExit(true)
    }
  }, [isAuthenticated, user, isSuccessExit])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <div className='w-12 h-12 border-4 border-teal-600-light border-t-primary rounded-full animate-spin' />
      </div>
    )
  }

  if (isAuthenticated && user && isSuccessExit) {
    // Small delay to allow animation to play before actual route change
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/'
    }, 600)
  }

  return (
    <div className='min-h-screen flex flex-col relative bg-slate-50 overflow-hidden'>

      {/* ── Parallax Floating Shapes ── */}
      <div className='parallax-bg'>
        <div className='parallax-shape parallax-shape-1' />
        <div className='parallax-shape parallax-shape-2' />
        <div className='parallax-shape parallax-shape-3' />
        <div className='parallax-shape parallax-shape-4' />
        {/* Extra subtle blob */}
        <div className='parallax-blob animate-float-slow'
          style={{ width: 260, height: 260, background: 'linear-gradient(135deg, #0F766E22, #14B8A622)', top: '15%', right: '10%' }}
        />
      </div>

      {/* ── Content Layer ── */}
      <div className='relative z-10 flex flex-col min-h-screen'>

        {/* Top Section with Logo */}
        <div className='flex-shrink-0 pt-10 pb-6'>
          <div className={`flex justify-center transition-all duration-700 ${
            isSuccessExit ? 'opacity-0 scale-95 -translate-y-5' : 'animate-fade-in'
          }`}>
            <Logo variant='dark' size='lg' />
          </div>
        </div>

        {/* Bottom Section with Form Card */}
        <div className='flex-1 flex flex-col mt-4'>
          <div className={`flex-1 bg-white rounded-t-[2.5rem] shadow-lg border-t border-slate-200 transition-all duration-700 ease-in-out ${
            isSuccessExit ? 'translate-y-[100%] opacity-0' : 'animate-slide-up'
          }`}>
            <div className='px-8 py-10 max-w-md mx-auto w-full'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
