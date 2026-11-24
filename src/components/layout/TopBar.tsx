import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Menu, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { getInitials } from '../../lib/utils';

interface TopBarProps {
  onMenuToggle?: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.fullName || 'Admin';
  const displayEmail = user?.email || 'admin@meqwheels.in';
  const initial = getInitials(displayName) || 'A';

  return (
    <header className="sticky top-0 z-20 flex h-16 lg:h-20 items-center justify-between border-b border-neutral-900 bg-[#080808]/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 gap-3">
      {/* Left side: Hamburger button + mobile branding */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <img src="/mw-logo.png" alt="MEQ Wheels" className="h-7 w-7 rounded-full" />
          <span className="font-bold text-xs tracking-wider text-white">MEQ WHEELS</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xs sm:max-w-md hidden sm:block">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search bookings, customers, vehicles..."
          className="w-full rounded-2xl border border-neutral-800 bg-[#141414] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none transition-colors"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative rounded-full p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-[#080808] animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* User Profile Button & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full pl-1.5 pr-2 sm:pr-3 py-1 hover:bg-neutral-900 transition-colors cursor-pointer focus:outline-none"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              {initial}
            </div>
            <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">
              {displayName}
            </span>
            <ChevronDown size={14} className="text-neutral-500 hidden sm:inline" />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-neutral-800 bg-[#121212] shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{displayEmail}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <SettingsIcon size={14} className="text-neutral-400" />
                  <span>Business Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-neutral-800/80">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/30 transition-colors font-medium"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
