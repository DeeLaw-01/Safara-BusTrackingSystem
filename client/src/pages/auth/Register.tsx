import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Check, Mail, ArrowLeft } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { socketService } from '@/services/socket'

type Step = 'form' | 'otp'

export default function Register () {
  const location = useLocation()
  const pendingEmail = (location.state as { pendingEmail?: string })
    ?.pendingEmail

  const [step, setStep] = useState<Step>(pendingEmail ? 'otp' : 'form')
  const [formData, setFormData] = useState({
    name: '',
    email: pendingEmail ?? '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'rider' as 'rider' | 'driver'
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(pendingEmail ? 60 : 0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { error: storeError, clearError } = useAuthStore()

  // Start cooldown if coming from login redirect (OTP was already sent server-side)
  useEffect(() => {
    if (pendingEmail) {
      startResendCooldown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step 1: form ────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setLocalError('')
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.sendRegisterOtp({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        phone: formData.phone || undefined,
        role: formData.role
      })
      setStep('otp')
      startResendCooldown()
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to send verification code'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: OTP ─────────────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setLocalError('')
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
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    const code = otp.join('')
    if (code.length < 6) {
      setLocalError('Please enter the 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      // Call API directly to avoid setting store isLoading (which would unmount component)
      const { data: response } = await authApi.verifyRegisterOtp({
        email: formData.email,
        otp: code
      })
      const { user, token } = response.data

      // Only update store on success — this will trigger AuthLayout redirect
      localStorage.setItem('token', token)
      socketService.connect(token)
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        pendingVerificationEmail: null
      })
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Invalid or expired verification code'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return
    clearError()
    setLocalError('')
    setOtp(['', '', '', '', '', ''])
    setIsSubmitting(true)

    try {
      if (pendingEmail) {
        // Coming from login redirect — user already exists, just resend OTP
        await authApi.resendRegisterOtp(formData.email)
      } else {
        // Normal registration flow — resend with full data
        await authApi.sendRegisterOtp({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          phone: formData.phone || undefined,
          role: formData.role
        })
      }
      startResendCooldown()
      otpRefs.current[0]?.focus()
    } catch (err: unknown) {
      setLocalError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to resend code'
      )
    } finally {
      setIsSubmitting(false)
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

  const displayError = storeError || localError

  // ── Render: OTP step ────────────────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <div className='space-y-6'>
        {/* Back button — only show if they came from the form (not from login redirect) */}
        {!pendingEmail && (
          <button
            onClick={() => {
              setStep('form')
              clearError()
              setLocalError('')
              setOtp(['', '', '', '', '', ''])
            }}
            className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' /> Back
          </button>
        )}

        <div className='text-center'>
          <div className='w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Mail className='w-7 h-7 text-red-500' />
          </div>
          <h2 className='text-2xl font-bold text-gray-800'>Check your email</h2>
          <p className='text-gray-500 text-sm mt-2'>
            We sent a 6-digit code to
            <br />
            <span className='font-semibold text-gray-700'>
              {formData.email}
            </span>
          </p>
        </div>

        {displayError && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center'>
            {displayError}
          </div>
        )}

        <form onSubmit={handleVerify} className='space-y-6'>
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
                className='w-12 h-14 text-center text-xl font-bold text-gray-800
                           bg-gray-50 border-2 border-gray-200 rounded-xl
                           focus:outline-none focus:border-red-400 focus:bg-white
                           transition-all duration-200'
              />
            ))}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='btn-coral w-full'
          >
            {isSubmitting ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              'Verify & Create Account'
            )}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500'>
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className='font-semibold text-red-500 hover:text-red-600 disabled:text-gray-400
                       disabled:cursor-not-allowed transition-colors'
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </p>

        {pendingEmail && (
          <p className='text-center text-gray-600 text-sm'>
            <Link
              to='/login'
              className='text-red-500 hover:text-red-600 font-semibold transition-colors'
            >
              Back to Login
            </Link>
          </p>
        )}
      </div>
    )
  }

  // ── Render: Form step ───────────────────────────────────────────────────────

  return (
    <div className='space-y-5'>
      <div>
        <h2 className='text-2xl font-bold text-gray-800'>Create Account</h2>
        <p className='text-gray-500 text-sm mt-1'>
          Join Bus Smart System today
        </p>
      </div>

      {displayError && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm'>
          {displayError}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Full Name
          </label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            className='input-auth'
            placeholder='Enter your full name'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Email Address
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            className='input-auth'
            placeholder='Enter your email'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Phone Number{' '}
            <span className='text-gray-400 font-normal'>(Optional)</span>
          </label>
          <input
            type='tel'
            name='phone'
            value={formData.phone}
            onChange={handleChange}
            className='input-auth'
            placeholder='Enter your phone number'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            I am a
          </label>
          <div className='grid grid-cols-2 gap-3'>
            {(['rider', 'driver'] as const).map(r => (
              <button
                key={r}
                type='button'
                onClick={() => setFormData({ ...formData, role: r })}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.role === r
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {formData.role === r && (
                  <div className='absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                    <Check className='w-3 h-3 text-white' />
                  </div>
                )}
                <div className='text-2xl mb-1'>
                  {r === 'rider' ? '🚌' : '🎫'}
                </div>
                <div className='text-sm font-semibold text-gray-800 capitalize'>
                  {r}
                </div>
                <div className='text-xs text-gray-500'>
                  {r === 'rider' ? 'Student / Parent' : 'Bus Operator'}
                </div>
              </button>
            ))}
          </div>
          {formData.role === 'driver' && (
            <p className='mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg'>
              ⚠️ Driver accounts require admin approval before activation.
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Password
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formData.password}
              onChange={handleChange}
              className='input-auth pr-12'
              placeholder='Create a password'
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

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            className='input-auth'
            placeholder='Confirm your password'
            required
          />
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='btn-coral w-full mt-2'
        >
          {isSubmitting ? (
            <Loader2 className='w-5 h-5 animate-spin' />
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className='text-center text-gray-600 text-sm'>
        Already have an account?{' '}
        <Link
          to='/login'
          className='text-red-500 hover:text-red-600 font-semibold transition-colors'
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
