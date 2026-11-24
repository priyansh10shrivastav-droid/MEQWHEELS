import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Lock,
  Mail,
  ShieldAlert,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };


  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <img
              src="/mw-logo.png"
              alt="MEQ Wheels"
              className="h-20 w-20 rounded-full border border-neutral-800 bg-[#0e0e0e] shadow-xl p-1"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#080808]">
              <ShieldCheck size={14} className="text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">MEQ WHEELS</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium">
              Ride Your Way
            </p>
          </div>
        </div>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-neutral-800 bg-[#121212]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">Admin Portal Access</h2>
            <p className="text-xs text-neutral-400">
              Sign in with your administrator account to manage operations.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Access Restricted</p>
                <p className="mt-0.5 text-red-300/90">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Administrator Email *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  placeholder="admin@meqwheels.in"
                  {...register('email')}
                  className={`w-full rounded-xl border bg-neutral-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full rounded-xl border bg-neutral-900/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Stay signed in on this device</span>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full py-2.5 mt-2"
              loading={isSubmitting}
              icon={<ArrowRight size={16} />}
            >
              Sign In to Admin Portal
            </Button>
          </form>

        </div>

        {/* Security watermark footer */}
        <div className="text-center text-[11px] text-neutral-600 space-y-1">
          <p>Protected by MEQ Wheels Role-Based Security & Supabase Auth</p>
          <p>© 2026 MEQ Wheels. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
