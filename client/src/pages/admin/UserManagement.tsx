import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Mail,
  Search,
  Check,
  X,
  Trash2,
  Loader2,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserPlus,
  Plus,
  Settings2,
  Send,
  Bus,
  Filter
} from 'lucide-react';
import { adminApi } from '@/services/api'
import type { User } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'

interface Invitation {
  _id: string
  email: string
  invitedBy: { _id: string; name: string; email: string } | null
  token: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'revoked'
  role: 'rider' | 'driver'
  createdAt: string
}

type TabType = 'users' | 'invitations';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);

  // Invitations State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<'rider' | 'driver'>('rider');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFilter, setInviteFilter] = useState<string>('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void) =>
    setConfirmModal({ open: true, title, message, confirmLabel, onConfirm });
  const closeConfirmModal = () => setConfirmModal(m => ({ ...m, open: false }));

  // Toast
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const { data } = await adminApi.getUsers({
        role: roleFilter || undefined,
        search: userSearch || undefined,
        page: userPage,
        limit: 10,
      });
      setUsers(data.data);
      setTotalUserPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, roleFilter, userSearch]);

  const loadPendingDrivers = useCallback(async () => {
    try {
      const { data } = await adminApi.getPendingDrivers();
      setPendingDrivers(data.data);
    } catch (err) {
      console.error('Failed to load pending drivers:', err);
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    try {
      setLoadingInvites(true);
      const params: Record<string, string> = { limit: '100' };
      if (inviteFilter) params.status = inviteFilter;
      const { data } = await adminApi.listInvitations(params);
      setInvitations(data.data);
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoadingInvites(false);
    }
  }, [inviteFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
      loadPendingDrivers();
    } else if (activeTab === 'invitations') {
      loadInvitations();
    }
  }, [activeTab, loadUsers, loadPendingDrivers, loadInvitations]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleApproveDriver = async (id: string) => {
    try {
      await adminApi.approveDriver(id);
      setSuccess('Driver approved successfully');
      loadPendingDrivers(); loadUsers();
    } catch { setError('Failed to approve driver'); }
  };

  const handleRejectDriver = (id: string) => {
    openConfirm('Reject Driver', 'Are you sure you want to reject this driver?', 'Reject', async () => {
      closeConfirmModal();
      try {
        await adminApi.rejectDriver(id);
        setSuccess('Driver rejected');
        loadPendingDrivers();
      } catch { setError('Failed to reject driver'); }
    });
  };

  const handleDeleteUser = (id: string) => {
    openConfirm('Delete User', 'This will permanently delete the user. This action cannot be undone.', 'Delete', async () => {
      closeConfirmModal();
      try {
        await adminApi.deleteUser(id);
        setSuccess('User deleted');
        loadUsers();
      } catch { setError('Failed to delete user'); }
    });
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmails.trim()) return;
    const emails = inviteEmails.split(/[,\s\n]+/).map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setIsSendingInvite(true);
    try {
      if (emails.length === 1) {
        await adminApi.createInvitation(emails[0], inviteRole);
        setSuccess(`Invitation sent to ${emails[0]}`);
      } else {
        const { data } = await adminApi.createBatchInvitations(emails, inviteRole);
        setSuccess(`Sent ${data.successful} invitations.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`);
        if (data.failed > 0) setError(`Failed: ${data.results.failed.map((f: any) => f.email).join(', ')}`);
      }
      setInviteEmails('');
      setIsInviteModalOpen(false);
      loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitations');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRevokeInvite = (id: string) => {
    openConfirm('Revoke Invitation', 'Are you sure you want to revoke this invitation?', 'Revoke', async () => {
      closeConfirmModal();
      setRevokingId(id);
      try {
        await adminApi.revokeInvitation(id);
        setSuccess('Invitation revoked');
        loadInvitations();
      } catch {
        setError('Failed to revoke invitation');
      } finally { setRevokingId(null); }
    });
  };

  const handleResendInvite = async (id: string, email: string) => {
    setResendingId(id);
    try {
      await adminApi.resendInvitation(id);
      setSuccess(`Invitation resent to ${email}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend');
    } finally { setResendingId(null); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setOpenRoleMenu(null);
    try {
      await adminApi.changeUserRole(userId, newRole);
      setSuccess('Role updated');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change role');
    }
  };

  const handleInviteUserTrigger = () => {
    setActiveTab('invitations');
    setIsInviteModalOpen(true);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const inviteStats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    revoked: invitations.filter(i => i.status === 'revoked').length,
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      driver: 'bg-blue-100 text-blue-700 border-blue-200',
      rider: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border ${map[role] ?? map.rider}`}>
        {role}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode }> = {
      pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className='w-3 h-3' /> },
      accepted: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className='w-3 h-3' /> },
      revoked:  { cls: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle className='w-3 h-3' /> },
    };
    const { cls, icon } = map[status] ?? map.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className='max-w-6xl mx-auto space-y-6 pb-12'>

      {/* ── Page Header ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 text-2xl">User Management</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Manage users, roles, and invitation links.</p>
        </div>
        <button
          onClick={handleInviteUserTrigger}
          className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 px-5 h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5'
        >
          <UserPlus className='w-4 h-4' />
          Invite New User
        </button>
      </div>

      {/* ── Toast Alerts ── */}
      {success && (
        <div className='flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 shadow-sm text-sm font-medium'>
          <CheckCircle className='w-5 h-5 shrink-0' />
          {success}
        </div>
      )}
      {error && (
        <div className='flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm text-sm font-medium'>
          <XCircle className='w-5 h-5 shrink-0' />
          {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className='flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm'>
        {([
          { id: 'users', label: 'Users', icon: Users, count: users.length },
          { id: 'invitations', label: 'Invitations', icon: Mail, count: inviteStats.pending || undefined },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm shadow-primary/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className='w-4 h-4' />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ USERS TAB ══ */}
      {activeTab === 'users' && (
        <div className='space-y-5'>

          {/* Pending Driver Approvals Banner */}
          {pendingDrivers.length > 0 && (
            <div className='rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='p-1.5 bg-amber-100 rounded-lg'>
                  <AlertCircle className='w-4 h-4 text-amber-600' />
                </div>
                <h2 className='font-bold text-amber-900 text-sm'>Pending Driver Approvals ({pendingDrivers.length})</h2>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {pendingDrivers.map(driver => (
                  <div key={driver._id} className='flex items-center justify-between p-4 bg-white rounded-xl border border-amber-100 shadow-sm'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <UserAvatar name={driver.name} avatar={driver.avatar} size='md' />
                      <div className='min-w-0'>
                        <div className='font-bold text-slate-800 text-sm truncate'>{driver.name}</div>
                        <div className='text-xs text-slate-500 truncate'>{driver.email}</div>
                      </div>
                    </div>
                    <div className='flex gap-2 shrink-0 ml-3'>
                      <button
                        onClick={() => handleApproveDriver(driver._id)}
                        className='p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm'
                        title='Approve'
                      >
                        <Check className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleRejectDriver(driver._id)}
                        className='p-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-all'
                        title='Reject'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500/50' />
              <input
                type='text'
                placeholder='Search by name or email...'
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadUsers()}
                className='input pl-10 h-11 w-full'
              />
            </div>
            <div className='flex gap-2'>
              <div className='relative'>
                <Filter className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500/50 pointer-events-none' />
                <select
                  value={roleFilter}
                  onChange={e => { setRoleFilter(e.target.value); setUserPage(1); }}
                  className='input pl-8 h-11 pr-3 min-w-[130px]'
                >
                  <option value=''>All Roles</option>
                  <option value='rider'>Riders</option>
                  <option value='driver'>Drivers</option>
                  <option value='admin'>Admins</option>
                </select>
              </div>
              <button onClick={loadUsers} className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors px-6 h-11 shrink-0'>Search</button>
            </div>
          </div>

          {/* Users Table */}
          <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
            {loadingUsers ? (
              <div className='flex items-center justify-center py-20'>
                <Loader2 className='w-8 h-8 animate-spin text-teal-600' />
              </div>
            ) : users.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-slate-500'>
                <Users className='w-10 h-10 mb-3 opacity-30' />
                <p className='font-medium'>No users found</p>
                <p className='text-sm opacity-60 mt-1'>Try adjusting your search or filter.</p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-slate-200 bg-slate-50/60'>
                        <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>User</th>
                        <th className='text-center px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Role</th>
                        <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Status</th>
                        <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell'>Joined</th>
                        <th className='text-right px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, i) => (
                        <tr
                          key={user._id}
                          className={`group border-b border-slate-200/60 last:border-0 hover:bg-slate-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/20'}`}
                        >
                          <td className='px-5 py-4'>
                            <div className='flex items-center gap-3'>
                              <UserAvatar name={user.name} avatar={user.avatar} size='md' />
                              <div className='min-w-0'>
                                <div className='font-semibold text-slate-800 text-sm truncate'>{user.name}</div>
                                <div className='text-xs text-slate-500 truncate'>{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className='px-5 py-4 text-center'>
                            <div className='relative inline-block'>
                              <button
                                disabled={user.role === 'admin'}
                                onClick={() => setOpenRoleMenu(openRoleMenu === user._id ? null : user._id)}
                                className={`flex items-center gap-1 transition-all ${user.role !== 'admin' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} ${openRoleMenu === user._id ? 'ring-2 ring-teal-500/30 ring-offset-1 rounded-md' : ''}`}
                              >
                                {roleBadge(user.role)}
                                {user.role !== 'admin' && <Settings2 className='w-3 h-3 text-slate-500/40' />}
                              </button>
                              {openRoleMenu === user._id && (
                                <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 w-28 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1'>
                                  {['rider', 'driver'].filter(r => r !== user.role).map(role => (
                                    <button
                                      key={role}
                                      onClick={() => handleRoleChange(user._id, role)}
                                      className='w-full text-left px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors capitalize'
                                    >
                                      → {role}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-5 py-4'>
                            {user.isApproved ? (
                              <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-green-700'>
                                <UserCheck className='w-3.5 h-3.5' /> Approved
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600'>
                                <Clock className='w-3.5 h-3.5' /> Pending
                              </span>
                            )}
                          </td>
                          <td className='px-5 py-4 text-xs text-slate-500 hidden md:table-cell'>
                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className='px-5 py-4 text-right'>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className='p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100'
                                title='Delete user'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalUserPages > 1 && (
                  <div className='flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/30'>
                    <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className='btn-secondary px-4 py-1.5 text-sm disabled:opacity-40'>← Prev</button>
                    <span className='text-sm text-slate-500 font-medium'>Page {userPage} / {totalUserPages}</span>
                    <button disabled={userPage === totalUserPages} onClick={() => setUserPage(p => p + 1)} className='btn-secondary px-4 py-1.5 text-sm disabled:opacity-40'>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ INVITATIONS TAB ══ */}
      {activeTab === 'invitations' && (
        <div className='space-y-5'>

          {/* Stat Cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {[
              { label: 'Total', count: inviteStats.total, color: 'border-content-secondary/20', numColor: 'text-slate-800' },
              { label: 'Pending', count: inviteStats.pending, color: 'border-amber-200 bg-amber-50/60', numColor: 'text-amber-600' },
              { label: 'Accepted', count: inviteStats.accepted, color: 'border-green-200 bg-green-50/60', numColor: 'text-green-600' },
              { label: 'Revoked', count: inviteStats.revoked, color: 'border-red-200 bg-red-50/60', numColor: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${s.color}`}>
                <div className='text-[10px] uppercase font-bold tracking-widest text-slate-500/60 mb-1'>{s.label}</div>
                <div className={`text-3xl font-semibold font-bold ${s.numColor}`}>{s.count}</div>
              </div>
            ))}
          </div>

          {/* Filter & New Invite row */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between'>
            <div className='flex gap-1.5 flex-wrap'>
              {(['', 'pending', 'accepted', 'revoked'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setInviteFilter(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    inviteFilter === s
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-teal-600/40 hover:text-teal-600'
                  }`}
                >
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 px-5 h-9 text-sm shrink-0'
            >
              <Plus className='w-4 h-4' />
              New Invite
            </button>
          </div>

          {/* Invitations Table */}
          <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
            {loadingInvites ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='w-7 h-7 animate-spin text-teal-600' />
              </div>
            ) : invitations.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-slate-500'>
                <Mail className='w-10 h-10 mb-3 opacity-30' />
                <p className='font-medium'>No invitations yet</p>
                <p className='text-sm opacity-60 mt-1'>Press "New Invite" to start onboarding users.</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-slate-200 bg-slate-50/60'>
                      <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Recipient</th>
                      <th className='text-center px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Invited As</th>
                      <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Status</th>
                      <th className='text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell'>Expires</th>
                      <th className='text-right px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv, i) => (
                      <tr
                        key={inv._id}
                        className={`group border-b border-slate-200/60 last:border-0 transition-colors ${
                          inv.status === 'revoked' ? 'bg-red-50/30 opacity-70' : i % 2 === 0 ? 'hover:bg-slate-50/40' : 'bg-slate-50/20 hover:bg-slate-50/40'
                        }`}
                      >
                        <td className='px-5 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0'>
                              <Mail className='w-3.5 h-3.5 text-slate-500/50' />
                            </div>
                            <span className='text-sm font-semibold text-slate-800'>{inv.email}</span>
                          </div>
                        </td>
                        <td className='px-5 py-4 text-center'>
                          {roleBadge(inv.role || 'rider')}
                        </td>
                        <td className='px-5 py-4'>{statusBadge(inv.status)}</td>
                        <td className='px-5 py-4 text-xs text-slate-500 hidden md:table-cell'>
                          {new Date(inv.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className='px-5 py-4 text-right'>
                          {inv.status === 'pending' && (
                            <div className='flex justify-end gap-1'>
                              <button
                                onClick={() => handleResendInvite(inv._id, inv.email)}
                                className='p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-600/5 rounded-lg transition-all'
                                title='Resend'
                              >
                                {resendingId === inv._id ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <RefreshCw className='w-3.5 h-3.5' />}
                              </button>
                              <button
                                onClick={() => handleRevokeInvite(inv._id)}
                                className='p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all'
                                title='Revoke'
                              >
                                {revokingId === inv._id ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <XCircle className='w-3.5 h-3.5' />}
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
      )}

      {/* ══ INVITE MODAL ══ */}
      {isInviteModalOpen && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
          <div className='bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden'>
            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-200'>
              <div>
                <h3 className='text-lg font-bold text-slate-800'>Invite Users</h3>
                <p className='text-xs text-slate-500 mt-0.5'>Send registration links to one or many users.</p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className='p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className='p-6 space-y-5'>
              {/* Email textarea */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Email Addresses
                </label>
                <div className='relative'>
                  <textarea
                    required
                    placeholder={'user1@example.com\nuser2@example.com, user3@example.com'}
                    value={inviteEmails}
                    onChange={e => setInviteEmails(e.target.value)}
                    className='input min-h-[110px] pt-3 resize-none leading-relaxed text-sm'
                    autoFocus
                  />
                  <div className='absolute bottom-2 right-3 text-[10px] text-slate-500/40 font-medium'>
                    comma or newline separated
                  </div>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>
                  Invite As
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {([
                    { value: 'rider', label: 'Rider', icon: Users, desc: 'Auto-approved, can track buses' },
                    { value: 'driver', label: 'Driver', icon: Bus, desc: 'Requires admin approval' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => setInviteRole(opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        inviteRole === opt.value
                          ? 'border-teal-600 bg-teal-600/5 text-teal-600'
                          : 'border-slate-200 text-slate-500 hover:border-teal-600/40 hover:text-slate-800'
                      }`}
                    >
                      <opt.icon className='w-6 h-6' />
                      <div>
                        <div className='font-bold text-sm text-center'>{opt.label}</div>
                        <div className='text-[10px] text-center opacity-70 mt-0.5 leading-tight'>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type='submit'
                disabled={isSendingInvite || !inviteEmails.trim()}
                className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full h-12 text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {isSendingInvite ? (
                  <><Loader2 className='w-4 h-4 animate-spin' /> Sending...</>
                ) : (
                  <><Send className='w-4 h-4' /> Send Invitations</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ══ CONFIRM MODAL ══ */}
      {confirmModal.open && (
        <div className='fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
          <div className='bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-amber-100 rounded-lg'>
                <AlertCircle className='w-6 h-6 text-amber-600' />
              </div>
              <h3 className='text-lg font-bold text-slate-800'>{confirmModal.title}</h3>
            </div>
            <p className='text-sm text-slate-500 mb-6 leading-relaxed'>
              {confirmModal.message}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={closeConfirmModal}
                className='btn-secondary flex-1'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  closeConfirmModal();
                }}
                className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex-1 !bg-red-600 !hover:bg-red-700'
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
