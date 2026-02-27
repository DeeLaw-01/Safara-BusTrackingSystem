import { useEffect, useState } from 'react';
import { 
  Search, 
  Check, 
  X, 
  Trash2, 
  Loader2,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '@/services/api'
import type { User } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'

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
      <div className="">
        <Loader2 className="" />
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        <h1 className="">Manage Users</h1>
      </div>

      {/* Pending Drivers Alert */}
      {pendingDrivers.length > 0 && (
        <div className="">
          <div className="">
            <AlertCircle className="" />
            <h2 className="">
              {pendingDrivers.length} Driver{pendingDrivers.length > 1 ? 's' : ''} Pending Approval
            </h2>
          </div>
          <div className="">
            {pendingDrivers.map((driver) => (
              <div
                key={driver._id}
                className=""
              >
                <div>
                  <div className="">{driver.name}</div>
                  <div className="">{driver.email}</div>
                </div>
                <div className="">
                  <button
                    onClick={() => handleApproveDriver(driver._id)}
                    className=""
                    title="Approve"
                  >
                    <Check className="" />
                  </button>
                  <button
                    onClick={() => handleRejectDriver(driver._id)}
                    className=""
                    title="Reject"
                  >
                    <X className="" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="">
        <form onSubmit={handleSearch} className="">
          <div className="">
            <div className="">
              <Search className="" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className=""
              />
            </div>
          </div>
          <div className="">
            <Filter className="" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className=""
            >
              <option value="">All Roles</option>
              <option value="rider">Riders</option>
              <option value="driver">Drivers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <button type="submit" className="">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="">
        <div className="">
          <table className="">
            <thead>
              <tr className="">
                <th className="">User</th>
                <th className="">Role</th>
                <th className="">Status</th>
                <th className="">Joined</th>
                <th className="">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="">
                  <td className="">
                    <div className="">
                      <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                      <div>
                        <div className="">{user.name}</div>
                        <div className="">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-600'
                        : user.role === 'driver'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="">
                    {user.isApproved ? (
                      <span className="">
                        <UserCheck className="" />
                        Approved
                      </span>
                    ) : (
                      <span className="">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className=""
                      title="Delete"
                    >
                      <Trash2 className="" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className=""
            >
              Previous
            </button>
            <span className="">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className=""
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

