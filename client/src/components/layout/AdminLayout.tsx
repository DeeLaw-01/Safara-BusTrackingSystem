import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Bus,
  LayoutDashboard,
  Users,
  Route as RouteIcon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Home
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import UserAvatar from '@/components/ui/UserAvatar'

/* ─────────────────── Navigation Config ─────────────────── */
const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' }
    ]
  },
  {
    title: 'Management',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/routes', icon: RouteIcon, label: 'Routes' },
      { to: '/admin/buses', icon: Bus, label: 'Buses' }
    ]
  }
]

/* ─────────────────── Page Title Helper ─────────────────── */
function getPageMeta (pathname: string): { title: string; breadcrumbs: string[] } {
  if (pathname === '/admin') return { title: 'Dashboard', breadcrumbs: ['Admin', 'Dashboard'] }
  if (pathname.startsWith('/admin/users')) return { title: 'User Management', breadcrumbs: ['Admin', 'Users'] }
  if (pathname.includes('/builder')) return { title: 'Route Builder', breadcrumbs: ['Admin', 'Routes', 'Builder'] }
  if (pathname.startsWith('/admin/routes')) return { title: 'Routes', breadcrumbs: ['Admin', 'Routes'] }
  if (pathname.startsWith('/admin/buses')) return { title: 'Buses', breadcrumbs: ['Admin', 'Buses'] }
  return { title: 'Admin', breadcrumbs: ['Admin'] }
}

/* ═══════════════════════════════════════════════════════════
   ADMIN LAYOUT
   ═══════════════════════════════════════════════════════════ */
export default function AdminLayout () {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { title, breadcrumbs } = getPageMeta(location.pathname)

  return (
    <div className='h-screen flex overflow-hidden bg-slate-50 grid-pattern'>

      {/* ═══ DESKTOP SIDEBAR (LIGHT) ═══ */}
      <aside
        className={`hidden lg:flex flex-col bg-white h-screen sticky top-0 z-30 transition-all duration-300 border-r border-slate-200 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <SidebarInner
          user={user}
          logout={logout}
          location={location}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNavClick={() => {}}
        />
      </aside>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[210] w-[260px] bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarInner
          user={user}
          logout={logout}
          location={location}
          collapsed={false}
          setCollapsed={() => {}}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className='flex-1 flex flex-col min-w-0 h-full'>

        {/* ── Desktop Header Bar ── */}
        <header className='hidden lg:flex items-center gap-4 h-16 px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shrink-0 sticky top-0 z-20'>
          {/* Breadcrumbs + Title */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-1.5 text-xs text-slate-400 mb-0.5'>
              <Home className='w-3 h-3' />
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className='flex items-center gap-1.5'>
                  <span className='text-slate-300'>/</span>
                  <span className={i === breadcrumbs.length - 1 ? 'text-teal-600 font-medium' : ''}>
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
            <h1 className='text-xl font-semibold text-slate-900 tracking-tight truncate'>
              {title}
            </h1>
          </div>

          {/* Search */}
          <div className='relative w-64'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
            <input
              type='text'
              placeholder='Search...'
              className='w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition'
            />
          </div>

          {/* Notifications */}
          <button className='relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors'>
            <Bell className='w-5 h-5' />
            <span className='absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full pulse-live' />
          </button>

          {/* User */}
          <div className='flex items-center gap-3 pl-3 border-l border-slate-200'>
            <UserAvatar name={user?.name} avatar={user?.avatar} size='sm' />
            <div className='text-right'>
              <div className='text-sm font-medium text-slate-800 truncate max-w-[120px]'>
                {user?.name}
              </div>
              <div className='text-xs text-teal-600'>Admin</div>
            </div>
          </div>
        </header>

        {/* ── Mobile Header ── */}
        <header className='lg:hidden flex items-center h-14 px-4 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20'>
          <button
            title='Open menu'
            onClick={() => setSidebarOpen(true)}
            className='p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors'
          >
            <Menu className='w-5 h-5' />
          </button>
          <h1 className='flex-1 text-center text-lg font-semibold text-slate-900'>
            {title}
          </h1>
          <div className='w-9' />
        </header>

        {/* ── Content ── */}
        <main className='flex-1 overflow-y-auto'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR INNER — shared between desktop and mobile
   ═══════════════════════════════════════════════════════════ */
function SidebarInner ({
  user, logout, location, collapsed, setCollapsed, onNavClick
}: {
  user: any; logout: () => void; location: any; collapsed: boolean;
  setCollapsed: (v: boolean) => void; onNavClick: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className={`h-16 flex items-center shrink-0 border-b border-slate-100 ${
        collapsed ? 'justify-center px-0' : 'px-5 gap-3'
      }`}>
        <Link to='/admin' className='flex items-center gap-3' onClick={onNavClick}>
          <div className='w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20'>
            <Bus className='w-5 h-5 text-white' />
          </div>
          {!collapsed && (
            <span className='text-lg font-bold text-slate-800 tracking-tight'>
              Safara
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-6' : ''}>
            {!collapsed && (
              <div className='px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400'>
                {section.title}
              </div>
            )}
            <div className='space-y-1'>
              {section.items.map(({ to, icon: Icon, label }) => {
                const isActive =
                  to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(to)

                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavClick}
                    title={collapsed ? label : undefined}
                    className={`group flex items-center gap-3 rounded-xl transition-all duration-150 ${
                      collapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 border-l-[3px] border-teal-500 font-semibold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-l-[3px] border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!collapsed && (
                      <span className='text-sm'>{label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className='hidden lg:block px-3 py-2 border-t border-slate-100'>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className='w-full flex items-center justify-center gap-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-xs'
        >
          {collapsed ? <ChevronRight className='w-4 h-4' /> : <ChevronLeft className='w-4 h-4' />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Mobile close */}
      <div className='lg:hidden absolute top-4 right-4'>
        <button
          onClick={onNavClick}
          className='p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
        >
          <X className='w-5 h-5' />
        </button>
      </div>

      {/* User section */}
      <div className={`shrink-0 border-t border-slate-100 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <div className='flex flex-col items-center gap-2'>
            <UserAvatar name={user?.name} avatar={user?.avatar} size='sm' />
            <button
              onClick={logout}
              title='Logout'
              className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
            >
              <LogOut className='w-4 h-4' />
            </button>
          </div>
        ) : (
          <>
            <div className='flex items-center gap-3 p-2 rounded-xl'>
              <UserAvatar name={user?.name} avatar={user?.avatar} size='sm' />
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium text-slate-700 truncate'>
                  {user?.name}
                </div>
                <div className='text-xs text-teal-600'>Administrator</div>
              </div>
            </div>
            <button
              onClick={logout}
              className='mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors'
            >
              <LogOut className='w-4 h-4' />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </>
  )
}
