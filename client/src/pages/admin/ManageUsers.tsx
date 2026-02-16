import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Loader2,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../../services/api';
import type { User } from '../../types';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
    loadPendingDrivers();
  }, [page, roleFilter]);

  const loadUsers = async () => {
    try {
      const { data } = await adminApi.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setUsers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingDrivers = async () => {
    try {
      const { data } = await adminApi.getPendingDrivers();
      setPendingDrivers(data.data);
    } catch (error) {
      console.error('Failed to load pending drivers:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleApproveDriver = async (id: string) => {
    try {
      await adminApi.approveDriver(id);
      loadPendingDrivers();
      loadUsers();
    } catch (error) {
      console.error('Failed to approve driver:', error);
    }
  };

  const handleRejectDriver = async (id: string) => {
    if (!confirm('Are you sure you want to reject this driver?')) return;
    try {
      await adminApi.rejectDriver(id);
      loadPendingDrivers();
    } catch (error) {
      console.error('Failed to reject driver:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Manage Users</h1>
      </div>

      {/* Pending Drivers Alert */}
      {pendingDrivers.length > 0 && (
        <div className="card bg-amber-500/10 border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-amber-400">
              {pendingDrivers.length} Driver{pendingDrivers.length > 1 ? 's' : ''} Pending Approval
            </h2>
          </div>
          <div className="space-y-2">
            {pendingDrivers.map((driver) => (
              <div
                key={driver._id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-white">{driver.name}</div>
                  <div className="text-sm text-slate-400">{driver.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveDriver(driver._id)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectDriver(driver._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="input w-auto"
            >
              <option value="">All Roles</option>
              <option value="rider">Riders</option>
              <option value="driver">Drivers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-slate-400">User</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Role</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : user.role === 'driver'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isApproved ? (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <UserCheck className="w-4 h-4" />
                        Approved
                      </span>
                    ) : (
                      <span className="text-amber-400 text-sm">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
