import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  Wrench,
  UserCheck,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } =
    useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    onClose();
    if (n.link) {
      navigate(n.link);
    }
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'return_due':
        return <Clock size={16} className="text-red-400" />;
      case 'payment_pending':
        return <CreditCard size={16} className="text-amber-400" />;
      case 'maintenance':
        return <Wrench size={16} className="text-orange-400" />;
      case 'verification':
        return <UserCheck size={16} className="text-blue-400" />;
      default:
        return <AlertCircle size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-neutral-800 bg-[#121212] shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/60">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center px-4 pt-2.5 pb-1 gap-2 border-b border-neutral-800/40 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`pb-1.5 px-2 font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-1.5 px-2 font-medium transition-colors border-b-2 ${
            filter === 'unread'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-800/50">
        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-500 mb-2">
              <Check size={20} />
            </div>
            <p className="text-xs font-medium text-neutral-300">All caught up!</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {filter === 'unread'
                ? 'No unread notifications at the moment.'
                : 'No active business notifications.'}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer group ${
                n.isRead
                  ? 'hover:bg-neutral-800/30 opacity-75'
                  : 'bg-emerald-950/10 hover:bg-emerald-950/20'
              }`}
            >
              <div className="rounded-lg p-2 bg-neutral-800/80 shrink-0 mt-0.5">
                {renderIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-semibold truncate ${n.isRead ? 'text-neutral-300' : 'text-white'}`}>
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatDate(n.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.link && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        View <ExternalLink size={9} />
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(n.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-neutral-300 rounded"
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 text-center border-t border-neutral-800/60 bg-neutral-900/40">
        <button
          onClick={() => {
            onClose();
            navigate('/bookings?filter=returns');
          }}
          className="text-[11px] text-neutral-400 hover:text-white transition-colors"
        >
          View all tasks & returns in Dashboard →
        </button>
      </div>
    </div>
  );
};
