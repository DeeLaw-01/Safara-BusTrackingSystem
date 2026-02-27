import { useEffect, useState, useCallback } from 'react'
import {
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Mail,
  X
} from 'lucide-react'
import { adminApi } from '@/services/api'

interface Invitation {
  _id: string
  email: string
  invitedBy: { _id: string; name: string; email: string } | null
  token: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
}

export default function ManageInvitations () {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<string>('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    try {
      const params: Record<string, string> = { limit: '100' }
      if (filter) params.status = filter
      const { data } = await adminApi.listInvitations(params)
      setInvitations(data.data)
    } catch {
      setError('Failed to load invitations')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) return

    setIsSending(true)
    try {
      await adminApi.createInvitation(email.trim())
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      fetchInvitations()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to send invitation'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?'))
      return
    setError('')
    setRevokingId(id)
    try {
      await adminApi.revokeInvitation(id)
      setSuccess('Invitation revoked successfully')
      fetchInvitations()
    } catch {
      setError('Failed to revoke invitation')
    } finally {
      setRevokingId(null)
    }
  }

  const handleResend = async (id: string, inviteEmail: string) => {
    setError('')
    setSuccess('')
    setResendingId(id)
    try {
      await adminApi.resendInvitation(id)
      setSuccess(`Invitation resent to ${inviteEmail}`)
      fetchInvitations()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to resend invitation'
      )
    } finally {
      setResendingId(null)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="" />
      case 'accepted':
        return <CheckCircle className="" />
      case 'revoked':
        return <XCircle className="" />
      default:
        return null
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      accepted: 'bg-green-50 text-green-700 border-green-200',
      revoked: 'bg-red-50 text-red-700 border-red-200'
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || ''}`}
      >
        {statusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="">
      <div>
        <h1 className="">
          Manage Invitations
        </h1>
        <p className="">
          Send invitation links to allow new users to register
        </p>
      </div>

      {/* Toast Notifications */}
      {success && (
        <div className="">
          <div className="">
            <CheckCircle className="" />
            <p className="">{success}</p>
            <button
              onClick={() => setSuccess('')}
              className=""
            >
              <X className="" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="">
          <div className="">
            <XCircle className="" />
            <p className="">{error}</p>
            <button
              onClick={() => setError('')}
              className=""
            >
              <X className="" />
            </button>
          </div>
        </div>
      )}

      {/* Send Invitation Form */}
      <div className="">
        <h2 className="">Invite a User</h2>

        <form onSubmit={handleSendInvitation} className="">
          <div className="">
            <label className="">
              Email Address
            </label>
            <div className="">
              <Mail className="" />
              <input
                type='email'
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setError('')
                  setSuccess('')
                }}
                placeholder='user@example.com'
                className=""
                required
              />
            </div>
          </div>
          <button
            type='submit'
            disabled={isSending || !email.trim()}
            className=""
          >
            {isSending ? (
              <Loader2 className="" />
            ) : (
              <Send className="" />
            )}
            Send Invite
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="">
        {['', 'pending', 'accepted', 'revoked'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
              ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-content-secondary hover:bg-app-bg border border-ui-border'
              }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Invitations Table */}
      <div className="">
        {isLoading ? (
          <div className="">
            <Loader2 className="" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="">
            <Mail className="" />
            <p className="">No invitations found</p>
          </div>
        ) : (
          <div className="">
            <table className="">
              <thead>
                <tr className="">
                  <th className="">
                    Email
                  </th>
                  <th className="">
                    Status
                  </th>
                  <th className="">
                    Invited By
                  </th>
                  <th className="">
                    Sent
                  </th>
                  <th className="">
                    Expires
                  </th>
                  <th className="">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {invitations.map(inv => (
                  <tr key={inv._id} className="">
                    <td className="">
                      {inv.email}
                    </td>
                    <td className="">
                      {statusBadge(inv.status)}
                      {inv.status === 'pending' && isExpired(inv.expiresAt) && (
                        <span className="">(expired)</span>
                      )}
                    </td>
                    <td className="">
                      {inv.invitedBy?.name || 'N/A'}
                    </td>
                    <td className="">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="">
                      {inv.status === 'pending' && (
                        <div className="">
                          <button
                            onClick={() => handleResend(inv._id, inv.email)}
                            disabled={resendingId === inv._id || revokingId === inv._id}
                            className=""
                            title='Resend invitation'
                          >
                            {resendingId === inv._id ? (
                              <Loader2 className="" />
                            ) : (
                              <RefreshCw className="" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(inv._id)}
                            disabled={resendingId === inv._id || revokingId === inv._id}
                            className=""
                            title='Revoke invitation'
                          >
                            {revokingId === inv._id ? (
                              <Loader2 className="" />
                            ) : (
                              <Trash2 className="" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

