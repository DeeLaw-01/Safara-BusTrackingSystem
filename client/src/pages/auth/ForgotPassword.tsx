import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  CheckCircle
} from 'lucide-react'
import { authApi } from '@/services/api'

type Step = 'email' | 'otp' | 'done'

export default function ForgotPassword () {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Step 1: Request OTP ─────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setStep('otp')
      startResendCooldown()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to send reset code'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify OTP + new password ───────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.join('').length < 6) {
      setError('Please enter the 6-digit code')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword({ email, otp: otp.join(''), newPassword })
      setStep('done')
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to reset password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setOtp(['', '', '', '', '', ''])
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      startResendCooldown()
      otpRefs.current[0]?.focus()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to resend code'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Step 3: Done
  if (step === 'done') {
    return (
      <div className='space-y-6 text-center'>
        <div className='flex flex-col items-center gap-4 py-4'>
          <div className='w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center'>
            <CheckCircle className='w-9 h-9 text-orange-500' />
          </div>
          <div>
            <h2 className='text-2xl font-semibold font-bold text-stone-800'>
              Password Reset!
            </h2>
            <p className='text-stone-500 text-sm mt-2'>
              Your password has been updated successfully.
              <br />
              You can now sign in with your new password.
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/login')} className='bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full'>
          Go to Login
        </button>
      </div>
    )
  }

  // Step 2: OTP + new password
  if (step === 'otp') {
    return (
      <div className='space-y-6'>
        <button
          onClick={() => {
            setStep('email')
            setError('')
            setOtp(['', '', '', '', '', ''])
          }}
          className='flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' /> Back
        </button>

        <div className='text-center'>
          <div className='w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Mail className='w-7 h-7 text-amber-600' />
          </div>
          <h2 className='text-2xl font-semibold font-bold text-stone-800'>Check your email</h2>
          <p className='text-stone-500 text-sm mt-2'>
            We sent a reset code to
            <br />
            <span className='font-semibold text-stone-800'>{email}</span>
          </p>
        </div>

        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center'>
            {error}
          </div>
        )}

        <form onSubmit={handleResetSubmit} className='space-y-5'>
          {/* OTP boxes */}
          <div>
            <label className='block text-sm font-medium text-stone-800 mb-3 text-center'>
              Enter 6-digit code
            </label>
            <div className='flex justify-center gap-3'>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => {
                    otpRefs.current[i] = el
                  }}
                  type='text'
                  inputMode='numeric'
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${i + 1}`}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                   className='w-12 h-14 text-center text-xl font-bold text-stone-800
                              bg-stone-50 border-2 border-stone-200 rounded-xl
                              focus:outline-none focus:border-amber-600/40 focus:bg-white
                              transition-all duration-200'
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className='block text-sm font-medium text-stone-800 mb-2'>
              New Password
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value)
                  setError('')
                }}
                className='input-auth pr-12'
                placeholder='Enter new password'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 transition-colors'
              >
                {showPassword ? (
                  <EyeOff className='w-5 h-5' />
                ) : (
                  <Eye className='w-5 h-5' />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className='block text-sm font-medium text-stone-800 mb-2'>
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              className='input-auth'
              placeholder='Confirm new password'
              required
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full'
          >
            {isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <p className='text-center text-sm text-stone-500'>
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className='font-semibold text-amber-600 hover:text-amber-700 disabled:text-stone-400
                       disabled:cursor-not-allowed transition-colors'
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </p>
      </div>
    )
  }

  // Step 1: Email input
  return (
    <div className='space-y-6'>
      <button
        onClick={() => navigate('/login')}
        className='flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' /> Back to Login
      </button>

      <div>
        <h2 className='text-2xl font-semibold font-bold text-stone-800'>Forgot Password?</h2>
        <p className='text-stone-500 text-sm mt-1'>
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm'>
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className='space-y-5'>
        <div>
          <label className='block text-sm font-medium text-stone-800 mb-2'>
            Email Address
          </label>
          <input
            type='email'
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setError('')
            }}
            className='input-auth'
            placeholder='Enter your registered email'
            required
            autoFocus
          />
        </div>

        <button type='submit' disabled={isLoading} className='bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full'>
          {isLoading ? (
            <Loader2 className='w-5 h-5 animate-spin' />
          ) : (
            'Send Reset Code'
          )}
        </button>
      </form>

      <p className='text-center text-stone-500 text-sm'>
        Remember your password?{' '}
        <Link
          to='/login'
          className='text-amber-600 hover:text-amber-700 font-semibold transition-colors'
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
