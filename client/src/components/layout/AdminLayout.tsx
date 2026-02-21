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
    <div className='min-h-screen bg-slate-950 flex'>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className='h-full flex flex-col'>
          {/* Logo */}
          <div className='h-16 flex items-center justify-between px-4 border-b border-slate-800'>
            <Link to='/admin' className='flex items-center gap-2'>
              <div className='p-2 bg-primary-600 rounded-lg'>
                <Bus className='w-5 h-5 text-white' />
              </div>
              <span className='text-xl font-display font-bold text-white'>
                BusTrack
              </span>
            </Link>
            <button
              title='Close Sidebar'
              onClick={() => setSidebarOpen(false)}
              className='lg:hidden p-2 text-slate-400 hover:text-white'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          {/* Nav */}
          <nav className='flex-1 p-4 space-y-1'>
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className='w-5 h-5' />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User */}
          <div className='p-4 border-t border-slate-800'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center'>
                <span className='text-white font-medium'>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className='text-sm font-medium text-white'>
                  {user?.name}
                </div>
                <div className='text-xs text-slate-400'>Administrator</div>
              </div>
            </div>
            <button
              onClick={logout}
              className='w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors'
            >
              <LogOut className='w-4 h-4' />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className='flex-1 flex flex-col min-h-screen'>
        {/* Header */}
        <header className='h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-4 lg:px-8 sticky top-0 z-30'>
          <button
            title='Open Sidebar'
            onClick={() => setSidebarOpen(true)}
            className='lg:hidden p-2 text-slate-400 hover:text-white mr-4'
          >
            <Menu className='w-6 h-6' />
          </button>
          <h1 className='text-xl font-display font-semibold text-white'>
            Admin Panel
          </h1>
        </header>

        {/* Content */}
        <main className='flex-1 p-4 lg:p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
