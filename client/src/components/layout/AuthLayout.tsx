import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'

export default function AuthLayout () {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-chocolate-700'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white'></div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    // Redirect based on role
    if (user.role === 'admin') return <Navigate to='/admin' replace />
    if (user.role === 'driver') return <Navigate to='/driver' replace />
    return <Navigate to='/' replace />
  }

  return (
    <div className='min-h-screen auth-bg-pattern flex flex-col bg-chocolate-700'>
      {/* Top Section with Logo */}
      <div className='flex-shrink-0 pt-8 pb-4'>
        <div className='flex justify-center animate-fade-in'>
          {/* White curved card for logo */}
          <div className='bg-white rounded-[2rem] px-12 py-8 shadow-2xl'>
            <Logo size='md' showText={true} />
          </div>
        </div>
      </div>

      {/* Bottom Section with Form */}
      <div className='flex-1 flex flex-col mt-6'>
        <div className='bg-white rounded-t-[3rem] flex-1 shadow-2xl animate-slide-up'>
          <div className='px-8 py-10 max-w-md mx-auto w-full'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
