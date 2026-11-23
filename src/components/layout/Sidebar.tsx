import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Users,
  LayoutGrid,
  CreditCard,
  BarChart2,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/vehicles', icon: LayoutGrid, label: 'Vehicles' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-neutral-900 bg-[#0c0c0c] px-4 py-6 transition-transform duration-200 ease-in-out lg:z-40 lg:translate-x-0',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="space-y-6">
          {/* Logo with Close button on mobile */}
          <div className="relative flex flex-col items-center text-center px-2">
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden absolute right-0 top-0 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
            <img src="/mw-logo.png" alt="MEQ Wheels" className="h-13 w-13 rounded-full mb-2.5" />
            <h1 className="text-base font-bold tracking-wider text-white">MEQ WHEELS</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mt-0.5">
              Ride Your Way
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#222222] text-white shadow-sm'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white',
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Settings at bottom */}
        <div className="pt-4 border-t border-neutral-900">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#222222] text-white shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white',
              )
            }
          >
            <Settings size={18} className="shrink-0" />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  );
};

