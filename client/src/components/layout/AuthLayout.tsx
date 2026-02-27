import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'

export default function AuthLayout () {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="">
        <div className=""></div>
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
    <div className="">
      {/* Top Section with Logo */}
      <div className="">
        <div className="">
          {/* White card for logo */}
          <div className="">
            <Logo size='md' showText={true} />
          </div>
        </div>
      </div>

      {/* Bottom Section with Form */}
      <div className="">
        <div className="">
          <div className="">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

