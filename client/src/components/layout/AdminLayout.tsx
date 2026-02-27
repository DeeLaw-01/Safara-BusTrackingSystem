import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Bus,
  LayoutDashboard,
  Users,
  Route as RouteIcon,
  LogOut,
  Menu,
  X,
  Mail,
  ShieldCheck
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/invitations', icon: Mail, label: 'Invitations' },
  { to: '/admin/roles', icon: ShieldCheck, label: 'Roles' },
  { to: '/admin/routes', icon: RouteIcon, label: 'Routes' },
  { to: '/admin/buses', icon: Bus, label: 'Buses' }
]

export default function AdminLayout () {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-ui-border shadow-sm transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="">
          {/* Logo */}
          <div className="">
            <Link to='/admin' className="">
              <div className="">
                <Bus className="" />
              </div>
              <span className="">
                BusTrack
              </span>
            </Link>
            <button
              title='Close Sidebar'
              onClick={() => setSidebarOpen(false)}
              className=""
            >
              <X className="" />
            </button>
          </div>

          {/* Nav */}
          <nav className="">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-content-secondary hover:bg-app-bg hover:text-content-primary'
                  }`}
                >
                  <Icon className="" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User */}
          <div className="">
            <div className="">
              <div className="">
                <span className="">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="">
                  {user?.name}
                </div>
                <div className="">Administrator</div>
              </div>
            </div>
            <button
              onClick={logout}
              className=""
            >
              <LogOut className="" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className=""
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="">
        {/* Header */}
        <header className="">
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className=""
          >
            <Menu className="" />
          </button>
          <h1 className="">
            Admin Panel
          </h1>
        </header>

        {/* Content */}
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

