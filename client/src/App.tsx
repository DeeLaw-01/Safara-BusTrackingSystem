import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

// Rider Pages
import RiderDashboard from '@/pages/rider/Dashboard'
import Settings from '@/pages/rider/Settings'
import MyAccount from '@/pages/rider/MyAccount'
import Notifications from '@/pages/rider/Notifications'
import HelpSupport from '@/pages/rider/HelpSupport'
import PrivacyPolicy from '@/pages/rider/PrivacyPolicy'

// Driver Pages
import DriverDashboard from '@/pages/driver/Dashboard'
import ActiveTrip from '@/pages/driver/ActiveTrip'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard'
import ManageRoutes from '@/pages/admin/ManageRoutes'
import RouteBuilder from '@/pages/admin/RouteBuilder'
import ManageBuses from '@/pages/admin/ManageBuses'
import UserManagement from '@/pages/admin/UserManagement'

// Driver layout wrapper (reuses the old AppLayout for drivers)
import AppLayout from '@/components/layout/AppLayout'

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
      <div className='min-h-screen flex items-center justify-center bg-stone-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600'></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to='/admin' replace />
    if (user.role === 'driver') return <Navigate to='/driver' replace />
    return <Navigate to='/' replace />
  }

  // Check if driver is approved
  if (user?.role === 'driver' && !user.isApproved) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-stone-50'>
        <div className='bg-white rounded-2xl border border-stone-200 shadow-sm p-5 max-w-md text-center'>
          <h2 className='text-2xl font-semibold font-bold text-stone-800 mb-4'>Account Pending Approval</h2>
          <p className='text-stone-500 mb-6'>
            Your driver account is pending admin approval. Please wait for
            verification.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className='btn-secondary'
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
      </Route>

      {/* Home Dispatcher / Rider Dashboard */}
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <HomeDispatcher />
          </ProtectedRoute>
        }
      />
      <Route
        path='/settings'
        element={
          <ProtectedRoute roles={['rider']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path='/account'
        element={
          <ProtectedRoute roles={['rider']}>
            <MyAccount />
          </ProtectedRoute>
        }
      />
      <Route
        path='/notifications'
        element={
          <ProtectedRoute roles={['rider']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path='/help'
        element={
          <ProtectedRoute roles={['rider']}>
            <HelpSupport />
          </ProtectedRoute>
        }
      />
      <Route
        path='/privacy'
        element={
          <ProtectedRoute roles={['rider']}>
            <PrivacyPolicy />
          </ProtectedRoute>
        }
      />

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
      <Route path='/admin' element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path='users' element={<UserManagement />} />
        <Route path='routes' element={<ManageRoutes />} />
        <Route path='buses' element={<ManageBuses />} />
        <Route path='routes/:id/builder' element={<RouteBuilder />} />
      </Route>

      {/* Catch all */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
function HomeDispatcher () {
  const { user } = useAuthStore()

  if (user?.role === 'admin') return <Navigate to='/admin' replace />
  if (user?.role === 'driver') return <Navigate to='/driver' replace />

  return <RiderDashboard />
}
