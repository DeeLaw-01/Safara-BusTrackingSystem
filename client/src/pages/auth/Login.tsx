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
    <div className="">
      {/* Header */}
      <div>
        <h2 className="">Login</h2>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="">
        {/* Email Field */}
        <div>
          <label className="">
            Email
          </label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            className=""
            placeholder='Enter your email'
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="">
            Password
          </label>
          <div className="">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className=""
              placeholder='Enter your password'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className=""
            >
              {showPassword ? (
                <EyeOff className="" />
              ) : (
                <Eye className="" />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type='submit'
          disabled={isLoading}
          className=""
        >
          {isLoading ? (
            <Loader2 className="" />
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Forgot Password Link */}
      <div className="">
        <Link 
          to='/forgot-password'
          className=""
        >
          Forgot Password?
        </Link>
      </div>

      {/* Sign Up Link */}
      <p className="">
        Don't have an account?{' '}
        <Link
          to='/register'
          className=""
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}

