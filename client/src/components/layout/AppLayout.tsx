import { Outlet, Link, useLocation } from 'react-router-dom'
import { Bus, LogOut, Navigation } from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuthStore } from '@/store/authStore'

export default function AppLayout () {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = [
    { to: '/driver', icon: Bus, label: 'Dashboard' },
    { to: '/driver/trip', icon: Navigation, label: 'Active Trip' }
  ]

  return (
    <div className="">
      {/* Header */}
      <header className="">
        <div className="">
          <Link to='/driver' className="">
            <div className="">
              <Bus className="" />
            </div>
            <span className="">
              BusTrack
            </span>
          </Link>

          <div className="">
            <div className="">
              <UserAvatar name={user?.name} size='sm' />
              <span className="">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className=""
              title='Logout'
            >
              <LogOut className="" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="">
        <div className="">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-content-secondary hover:text-primary'
                }`}
              >
                <Icon className="" />
                <span className="">{label}</span>
              </Link>
            )
          })}
          <button
            onClick={logout}
            className=""
          >
            <LogOut className="" />
            <span className="">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

