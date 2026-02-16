import { Outlet, Navigate } from 'react-router-dom';
import { Bus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect based on role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'driver') return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-800 to-accent-900" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Bus className="w-10 h-10 text-white" />
            </div>
            <span className="text-3xl font-display font-bold text-white">BusTrack</span>
          </div>
          
          <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Real-time tracking<br />
            for safer commutes
          </h1>
          
          <p className="text-xl text-white/80 max-w-md">
            Track your school bus in real-time, get notified when it's arriving, 
            and never miss your ride again.
          </p>

          <div className="mt-12 flex gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">20+</div>
              <div className="text-white/60">Active Buses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">1K+</div>
              <div className="text-white/60">Daily Riders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">99%</div>
              <div className="text-white/60">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-primary-600 rounded-xl">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">BusTrack</span>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
}
