import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, CalendarDays, LayoutGrid, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  onMenuToggle: () => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/vehicles', icon: LayoutGrid, label: 'Vehicles' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuToggle }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-neutral-900 bg-[#0c0c0c]/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'p-1 rounded-md transition-all',
                  isActive && 'bg-emerald-500/10 text-emerald-400',
                )}
              >
                <Icon size={19} />
              </div>
              <span className="mt-0.5">{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Menu / More button for Payments, Reports, Settings */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <div className="p-1 rounded-md">
          <Menu size={19} />
        </div>
        <span className="mt-0.5">More</span>
      </button>
    </nav>
  );
};
