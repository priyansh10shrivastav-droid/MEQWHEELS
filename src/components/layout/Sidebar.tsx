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

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-neutral-900 bg-[#0c0c0c] px-4 py-6">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center px-2">
          <img src="/mw-logo.png" alt="MEQ Wheels" className="h-14 w-14 rounded-full mb-3" />
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
  );
};

