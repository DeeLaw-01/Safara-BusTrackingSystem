import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, AlertTriangle } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { socketService } from '@/services/socket'

type Step = 'form' | 'otp'

export default function Register () {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Invitation token from URL query param (?invite=TOKEN)
  const inviteToken = searchParams.get('invite') || ''

  // If coming from login redirect (unverified email)
  const pendingEmail = (location.state as { pendingEmail?: string })
    ?.pendingEmail

  const [step, setStep] = useState<Step>(pendingEmail ? 'otp' : 'form')
  const [formData, setFormData] = useState({
    name: '',
    email: pendingEmail ?? '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(pendingEmail ? 60 : 0)
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken)
  const [inviteValid, setInviteValid] = useState(!!pendingEmail)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { error: storeError, clearError } = useAuthStore()

  // If no invite token and not a pending email redirect, show an error
  const hasInvite = inviteValid || !!pendingEmail

  // Validate the invitation token and pre-fill email
  useEffect(() => {
    if (!inviteToken) return
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await authApi.validateInvitation(inviteToken)
        if (!cancelled) {
          setFormData(prev => ({ ...prev, email: data.data.email }))
          setInviteValid(true)
        }
      } catch {
        if (!cancelled) {
          setInviteValid(false)
          setLocalError('This invitation link is invalid or has expired.')
        }
      } finally {
        if (!cancelled) setInviteLoading(false)
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken])

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
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        inviteToken
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
      const { data: response } = await authApi.verifyRegisterOtp({
        email: formData.email,
        otp: code
      })
      const { user, token } = response.data

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
        await authApi.resendRegisterOtp(formData.email)
      } else {
        await authApi.sendRegisterOtp({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        phone: formData.phone || undefined,
          inviteToken
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

  // ── Loading invitation ────────────────────────────────────────────────────

  if (inviteLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-stone-400 mb-4' />
        <p className='text-stone-500 text-sm'>Validating invitation...</p>
      </div>
    )
  }

  // ── No invitation ─────────────────────────────────────────────────────────

  if (!hasInvite) {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <AlertTriangle className='w-7 h-7 text-amber-600' />
          </div>
          <h2 className='text-2xl font-semibold font-bold text-stone-800'>
            Invitation Required
          </h2>
          <p className='text-stone-500 text-sm mt-2'>
            You need an invitation from your organization's administrator to
            create an account. Please check your email for an invitation link.
          </p>
        </div>

        <p className='text-center text-stone-500 text-sm'>
          Already have an account?{' '}
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

  // ── Render: OTP step ────────────────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <div className='space-y-6'>
        {!pendingEmail && (
          <button
            onClick={() => {
              setStep('form')
              clearError()
              setLocalError('')
              setOtp(['', '', '', '', '', ''])
            }}
            className='flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' /> Back
          </button>
        )}

        <div className='text-center'>
          <div className='w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Mail className='w-7 h-7 text-amber-600' />
          </div>
          <h2 className='text-2xl font-semibold font-bold text-stone-800'>Check your email</h2>
          <p className='text-stone-500 text-sm mt-2'>
            We sent a 6-digit code to
            <br />
            <span className='font-semibold text-stone-800'>
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
                className='w-12 h-14 text-center text-xl font-bold text-stone-800
                           bg-stone-50 border-2 border-stone-200 rounded-xl
                           focus:outline-none focus:border-amber-600/40 focus:bg-white
                           transition-all duration-200'
              />
            ))}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full'
          >
            {isSubmitting ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              'Verify & Create Account'
            )}
          </button>
        </form>

        <p className='text-center text-sm text-stone-500'>
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className='font-semibold text-amber-600 hover:text-amber-700 disabled:text-stone-400
                       disabled:cursor-not-allowed transition-colors'
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </p>

        {pendingEmail && (
          <p className='text-center text-stone-500 text-sm'>
            <Link
              to='/login'
              className='text-amber-600 hover:text-amber-700 font-semibold transition-colors'
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
        <h2 className='text-2xl font-semibold font-bold text-stone-800'>Create Account</h2>
        <p className='text-stone-500 text-sm mt-1'>
          Complete your registration to join Safara
        </p>
      </div>

      {displayError && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm'>
          {displayError}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-stone-800 mb-2'>
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
          <label className='block text-sm font-medium text-stone-800 mb-2'>
            Email Address
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            className='input-auth read-only:bg-stone-100 read-only:cursor-not-allowed'
            placeholder='Enter your email'
            required
            readOnly={!!inviteToken}
          />
          {inviteToken && (
            <p className='mt-1 text-xs text-stone-500'>
              Email is set by your invitation and cannot be changed.
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-stone-800 mb-2'>
            Phone Number{' '}
            <span className='text-stone-500 font-normal'>(Optional)</span>
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
          <label className='block text-sm font-medium text-stone-800 mb-2'>
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

        <div>
          <label className='block text-sm font-medium text-stone-800 mb-2'>
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
          className='bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full mt-2'
        >
          {isSubmitting ? (
            <Loader2 className='w-5 h-5 animate-spin' />
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className='text-center text-stone-500 text-sm'>
        Already have an account?{' '}
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
