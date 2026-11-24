import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser, LoginCredentials } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'meq_admin_session';

const DEFAULT_ADMIN: AdminUser = {
  id: 'usr-admin-01',
  email: 'admin@meqwheels.in',
  fullName: 'System Administrator',
  role: 'admin',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. First check local admin session
        const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed && parsed.role === 'admin') {
            setUser(parsed);
            setLoading(false);
            return;
          }
        }

        // 2. Check Supabase auth session if configured
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const adminUser: AdminUser = {
              id: session.user.id,
              email: session.user.email || 'admin@meqwheels.in',
              fullName: session.user.user_metadata?.full_name || 'Admin',
              role: 'admin',
            };
            setUser(adminUser);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        } else if (session?.user) {
          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || 'admin@meqwheels.in',
            fullName: session.user.user_metadata?.full_name || 'Admin',
            role: 'admin',
          };
          setUser(adminUser);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }: LoginCredentials) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Try Supabase Auth first if configured
    let supabaseSuccess = false;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error && data.user) {
          // Verify user role
          const role = data.user.user_metadata?.role || 'admin';
          if (role !== 'admin' && !cleanEmail.includes('admin')) {
            await supabase.auth.signOut();
            throw new Error('Access denied. Only administrators are authorized to log in.');
          }

          const adminUser: AdminUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            fullName: data.user.user_metadata?.full_name || 'Administrator',
            role: 'admin',
          };

          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
          setUser(adminUser);
          supabaseSuccess = true;
          toast.success('Welcome back, Admin!');
          return;
        }
      } catch (err: any) {
        // If it was explicitly an unauthorized error, rethrow
        if (err.message && err.message.includes('Access denied')) {
          throw err;
        }
        // Otherwise fallback to system admin credentials check
      }
    }

    // System admin login credentials check (admin@meqwheels.in / @Meqcruzmewada)
    if (cleanEmail === 'admin@meqwheels.in' && cleanPassword === '@Meqcruzmewada') {
      const adminUser: AdminUser = {
        ...DEFAULT_ADMIN,
        email: cleanEmail,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      setUser(adminUser);
      toast.success('Admin authenticated successfully');
      return;
    }

    throw new Error('Invalid admin email or password. Please verify your credentials.');
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      toast.success('Signed out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
