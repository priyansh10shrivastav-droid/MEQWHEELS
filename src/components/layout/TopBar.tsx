import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuToggle?: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
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
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#080808]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 rounded-full pl-1.5 pr-2 sm:pr-3 py-1 hover:bg-neutral-900 transition-colors cursor-pointer">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-white">
            A
          </div>
          <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">Admin</span>
          <ChevronDown size={14} className="text-neutral-500 hidden sm:inline" />
        </div>
      </div>
    </header>
  );
};
