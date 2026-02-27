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
      <div className="">
        <Loader2 className="" />
        <p className="">Validating invitation...</p>
      </div>
    )
  }

  // ── No invitation ─────────────────────────────────────────────────────────

  if (!hasInvite) {
    return (
      <div className="">
        <div className="">
          <div className="">
            <AlertTriangle className="" />
          </div>
          <h2 className="">
            Invitation Required
          </h2>
          <p className="">
            You need an invitation from your organization's administrator to
            create an account. Please check your email for an invitation link.
          </p>
        </div>

        <p className="">
          Already have an account?{' '}
          <Link
            to='/login'
            className=""
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
      <div className="">
        {!pendingEmail && (
          <button
            onClick={() => {
              setStep('form')
              clearError()
              setLocalError('')
              setOtp(['', '', '', '', '', ''])
            }}
            className=""
          >
            <ArrowLeft className="" /> Back
          </button>
        )}

        <div className="">
          <div className="">
            <Mail className="" />
          </div>
          <h2 className="">Check your email</h2>
          <p className="">
            We sent a 6-digit code to
            <br />
            <span className="">
              {formData.email}
            </span>
          </p>
        </div>

        {displayError && (
          <div className="">
            {displayError}
          </div>
        )}

        <form onSubmit={handleVerify} className="">
          <div className="">
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
                className=""
              />
            ))}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className=""
          >
            {isSubmitting ? (
              <Loader2 className="" />
            ) : (
              'Verify & Create Account'
            )}
          </button>
        </form>

        <p className="">
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className=""
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </p>

        {pendingEmail && (
          <p className="">
            <Link
              to='/login'
              className=""
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
    <div className="">
      <div>
        <h2 className="">Create Account</h2>
        <p className="">
          Complete your registration to join BusTrack
        </p>
      </div>

      {displayError && (
        <div className="">
          {displayError}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="">
        <div>
          <label className="">
            Full Name
          </label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            className=""
            placeholder='Enter your full name'
            required
          />
        </div>

        <div>
          <label className="">
            Email Address
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            className=""
            placeholder='Enter your email'
            required
            readOnly={!!inviteToken}
          />
          {inviteToken && (
            <p className="">
              Email is set by your invitation and cannot be changed.
            </p>
          )}
        </div>

        <div>
          <label className="">
            Phone Number{' '}
            <span className="">(Optional)</span>
          </label>
          <input
            type='tel'
            name='phone'
            value={formData.phone}
            onChange={handleChange}
            className=""
            placeholder='Enter your phone number'
          />
        </div>

        <div>
          <label className="">
            Password
          </label>
          <div className="">
            <input
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formData.password}
              onChange={handleChange}
              className=""
              placeholder='Create a password'
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

        <div>
          <label className="">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            className=""
            placeholder='Confirm your password'
            required
          />
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className=""
        >
          {isSubmitting ? (
            <Loader2 className="" />
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className="">
        Already have an account?{' '}
        <Link
          to='/login'
          className=""
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

