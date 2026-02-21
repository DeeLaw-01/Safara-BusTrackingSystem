import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import AuthCallback from '@/pages/auth/AuthCallback'

// Rider Pages
import RiderHome from '@/pages/rider/RiderHome'
import RiderOnboarding from '@/pages/rider/Onboarding'
import TrackBus from '@/pages/rider/TrackBus'
import MyReminders from '@/pages/rider/MyReminders'

// Driver Pages
import DriverDashboard from '@/pages/driver/Dashboard'
import ActiveTrip from '@/pages/driver/ActiveTrip'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard'
import ManageUsers from '@/pages/admin/ManageUsers'
import ManageRoutes from '@/pages/admin/ManageRoutes'
import ManageBuses from '@/pages/admin/ManageBuses'

// Protected Route Component
function ProtectedRoute ({
  children,
  roles
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500'></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to='/' replace />
  }

  // Check if driver is approved
  if (user?.role === 'driver' && !user.isApproved) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950'>
        <div className='card max-w-md text-center'>
          <h2 className='text-2xl font-bold mb-4'>Account Pending Approval</h2>
          <p className='text-slate-400 mb-6'>
            Your driver account is pending admin approval. Please wait for
            verification.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className='btn btn-secondary'
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App () {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/auth/callback' element={<AuthCallback />} />
      </Route>

      {/* Rider Routes */}
      <Route
        element={
          <ProtectedRoute roles={['rider']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path='/' element={<RiderHome />} />
        <Route path='/onboarding' element={<RiderOnboarding />} />
        <Route path='/track/:routeId' element={<TrackBus />} />
        <Route path='/reminders' element={<MyReminders />} />
      </Route>

      {/* Driver Routes */}
      <Route
        element={
          <ProtectedRoute roles={['driver']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path='/driver' element={<DriverDashboard />} />
        <Route path='/driver/trip' element={<ActiveTrip />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/admin/users' element={<ManageUsers />} />
        <Route path='/admin/routes' element={<ManageRoutes />} />
        <Route path='/admin/buses' element={<ManageBuses />} />
      </Route>

      {/* Catch all */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
