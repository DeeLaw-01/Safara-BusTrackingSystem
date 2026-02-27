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
      <div className="">
        <div className="">
          <div className="">
            <CheckCircle className="" />
          </div>
          <div>
            <h2 className="">
              Password Reset!
            </h2>
            <p className="">
              Your password has been updated successfully.
              <br />
              You can now sign in with your new password.
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/login')} className="">
          Go to Login
        </button>
      </div>
    )
  }

  // Step 2: OTP + new password
  if (step === 'otp') {
    return (
      <div className="">
        <button
          onClick={() => {
            setStep('email')
            setError('')
            setOtp(['', '', '', '', '', ''])
          }}
          className=""
        >
          <ArrowLeft className="" /> Back
        </button>

        <div className="">
          <div className="">
            <Mail className="" />
          </div>
          <h2 className="">Check your email</h2>
          <p className="">
            We sent a reset code to
            <br />
            <span className="">{email}</span>
          </p>
        </div>

        {error && (
          <div className="">
            {error}
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="">
          {/* OTP boxes */}
          <div>
            <label className="">
              Enter 6-digit code
            </label>
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
          </div>

          {/* New Password */}
          <div>
            <label className="">
              New Password
            </label>
            <div className="">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value)
                  setError('')
                }}
                className=""
                placeholder='Enter new password'
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

          {/* Confirm Password */}
          <div>
            <label className="">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              className=""
              placeholder='Confirm new password'
              required
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className=""
          >
            {isLoading ? (
              <Loader2 className="" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <p className="">
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className=""
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
    <div className="">
      <button
        onClick={() => navigate('/login')}
        className=""
      >
        <ArrowLeft className="" /> Back to Login
      </button>

      <div>
        <h2 className="">Forgot Password?</h2>
        <p className="">
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      {error && (
        <div className="">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="">
        <div>
          <label className="">
            Email Address
          </label>
          <input
            type='email'
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setError('')
            }}
            className=""
            placeholder='Enter your registered email'
            required
            autoFocus
          />
        </div>

        <button type='submit' disabled={isLoading} className="">
          {isLoading ? (
            <Loader2 className="" />
          ) : (
            'Send Reset Code'
          )}
        </button>
      </form>

      <p className="">
        Remember your password?{' '}
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

