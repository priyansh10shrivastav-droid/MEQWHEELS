import React from 'react';
import { Search, Bell, ChevronDown, User } from 'lucide-react';

interface TopBarProps {
  onGlobalSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = () => {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-neutral-900 bg-[#080808]/90 backdrop-blur-md px-8">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search bookings, customers, vehicles..."
          className="w-full rounded-2xl border border-neutral-800 bg-[#141414] pl-11 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-neutral-700 focus:outline-none transition-colors"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#080808]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-full pl-2 pr-3 py-1.5 hover:bg-neutral-900 transition-colors cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-white">
            A
          </div>
          <span className="text-sm font-medium text-white">Admin</span>
          <ChevronDown size={14} className="text-neutral-500" />
        </div>
      </div>
    </header>
  );
};
