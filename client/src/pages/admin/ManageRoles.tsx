import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
  Bus,
  ChevronDown
} from 'lucide-react'
import { adminApi } from '@/services/api'
import UserAvatar from '@/components/ui/UserAvatar'

interface User {
  _id: string
  name: string
  email: string
  role: string
  isApproved: boolean
  avatar?: string
  createdAt: string
}

export default function ManageRoles () {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 100 }
      if (search.trim()) params.search = search.trim()
      const { data } = await adminApi.getUsers(params)
      setUsers(data.data)
    } catch {
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timeout)
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('')
    setSuccess('')
    setChangingRole(userId)
    setOpenDropdown(null)

    try {
      await adminApi.changeUserRole(userId, newRole)
      setSuccess('Role updated successfully')
      fetchUsers()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to change role'
      )
    } finally {
      setChangingRole(null)
    }
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="" />
      case 'driver':
        return <Bus className="" />
      default:
        return <UserCheck className="" />
    }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      driver: 'bg-blue-50 text-blue-700 border-blue-200',
      rider: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[role] || colors.rider}`}
      >
        {roleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  return (
    <div className="">
      <div>
        <h1 className="">Manage Roles</h1>
        <p className="">
          Assign user roles — promote riders to drivers or vice versa
        </p>
      </div>

      {error && (
        <div className="">
          {error}
        </div>
      )}
      {success && (
        <div className="">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="">
        <Search className="" />
        <input
          type='text'
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search by name or email...'
          className=""
        />
      </div>

      {/* Users Table */}
      <div className="">
        {isLoading ? (
          <div className="">
            <Loader2 className="" />
          </div>
        ) : users.length === 0 ? (
          <div className="">
            <p className="">No users found</p>
          </div>
        ) : (
          <div className="">
            <table className="">
              <thead>
                <tr className="">
                  <th className="">
                    User
                  </th>
                  <th className="">
                    Current Role
                  </th>
                  <th className="">
                    Approved
                  </th>
                  <th className="">
                    Joined
                  </th>
                  <th className="">
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {users.map(user => (
                  <tr key={user._id} className="">
                    <td className="">
                      <div className="">
                        <UserAvatar
                          avatar={user.avatar}
                          name={user.name}
                          size='sm'
                        />
                        <div>
                          <p className="">
                            {user.name}
                          </p>
                          <p className="">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="">{roleBadge(user.role)}</td>
                    <td className="">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${user.isApproved ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="">
                      {user.role === 'admin' ? (
                        <span className="">System Admin</span>
                      ) : (
                        <div className="">
                          {changingRole === user._id ? (
                            <Loader2 className="" />
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown === user._id
                                      ? null
                                      : user._id
                                  )
                                }
                                className=""
                              >
                                Change Role
                                <ChevronDown className="" />
                              </button>

                              {openDropdown === user._id && (
                                <div className="">
                                  {['rider', 'driver']
                                    .filter(r => r !== user.role)
                                    .map(role => (
                                      <button
                                        key={role}
                                        onClick={() =>
                                          handleRoleChange(user._id, role)
                                        }
                                        className=""
                                      >
                                        <div className="">
                                          {roleIcon(role)}
                                        </div>
                                        {role.charAt(0).toUpperCase() +
                                          role.slice(1)}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </>
                          )}
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

