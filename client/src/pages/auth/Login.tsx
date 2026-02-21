import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Login () {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const {
    login,
    isLoading,
    error,
    clearError,
    pendingVerificationEmail,
    clearPendingVerification
  } = useAuthStore()

  // Redirect to register OTP screen if login detected an unverified email
  useEffect(() => {
    if (pendingVerificationEmail) {
      clearPendingVerification()
      navigate('/register', {
        state: { pendingEmail: pendingVerificationEmail }
      })
    }
  }, [pendingVerificationEmail, navigate, clearPendingVerification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
    } catch {
      // Error is handled in store
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-800'>Login</h2>
      </div>

      {/* Error Alert */}
      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Email Field */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Email
          </label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='input-auth'
            placeholder='Enter your email'
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Password
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='input-auth pr-12'
              placeholder='Enter your password'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              {showPassword ? (
                <EyeOff className='w-5 h-5' />
              ) : (
                <Eye className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='btn-coral w-full'
        >
          {isLoading ? (
            <Loader2 className='w-5 h-5 animate-spin' />
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Forgot Password Link */}
      <div className='text-center'>
        <Link 
          to='/forgot-password'
          className='text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors'
        >
          Forgot Password?
        </Link>
      </div>

      {/* Sign Up Link */}
      <p className='text-center text-gray-600 text-sm'>
        Don't have an account?{' '}
        <Link
          to='/register'
          className='text-red-500 hover:text-red-600 font-semibold transition-colors'
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
