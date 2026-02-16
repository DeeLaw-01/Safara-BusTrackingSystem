import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'rider' as 'rider' | 'driver',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
      });
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-display font-bold text-white mb-2">
          Create account
        </h2>
        <p className="text-slate-400">
          Join BusTrack to start tracking your bus
        </p>
      </div>

      {(error || validationError) && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error || validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input pl-12"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input pl-12"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Phone (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input pl-12"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'rider' })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.role === 'rider'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-lg font-medium text-white">Rider</div>
              <div className="text-sm text-slate-400">Student / Parent</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'driver' })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.role === 'driver'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-lg font-medium text-white">Driver</div>
              <div className="text-sm text-slate-400">Bus Operator</div>
            </button>
          </div>
          {formData.role === 'driver' && (
            <p className="mt-2 text-sm text-amber-400">
              Driver accounts require admin approval before activation.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pl-12 pr-12"
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input pl-12"
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-3"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
