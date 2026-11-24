import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppNotification, NotificationType } from '../types';
import { bookingService } from '../services/bookingService';
import { vehicleService } from '../services/vehicleService';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate } from '../lib/utils';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const READ_STORAGE_KEY = 'meq_read_notifications';
const DISMISSED_STORAGE_KEY = 'meq_dismissed_notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const refreshNotifications = useCallback(async () => {
    try {
      const [bookings, vehicles, customers] = await Promise.all([
        bookingService.getAll(),
        vehicleService.getAll(),
        customerService.getAll(),
      ]);

      const list: AppNotification[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      const threeDaysAhead = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

      // 1. Return Due Alerts
      bookings.forEach((b) => {
        if ((b.status === 'active' || b.status === 'confirmed') && b.returnDate >= todayStr && b.returnDate <= threeDaysAhead) {
          const isToday = b.returnDate === todayStr;
          list.push({
            id: `ret-${b.id}-${b.returnDate}`,
            type: 'return_due',
            title: isToday ? 'Vehicle Return Due Today' : 'Upcoming Vehicle Return',
            message: `${b.customerName} (${b.vehicleName}) is scheduled for return on ${formatDate(b.returnDate)} at ${b.returnTime}.`,
            timestamp: b.updatedAt || b.createdAt,
            isRead: readIds.has(`ret-${b.id}-${b.returnDate}`),
            link: `/bookings?view=${b.id}`,
            severity: isToday ? 'alert' : 'warning',
          });
        }
      });

      // 2. Pending Payments Alerts
      bookings.forEach((b) => {
        if (b.remainingBalance > 0 && b.status !== 'cancelled') {
          list.push({
            id: `pay-${b.id}`,
            type: 'payment_pending',
            title: 'Outstanding Balance Pending',
            message: `${b.customerName} has an outstanding balance of ${formatCurrency(b.remainingBalance)} for booking ${b.id}.`,
            timestamp: b.updatedAt || b.createdAt,
            isRead: readIds.has(`pay-${b.id}`),
            link: `/payments?bookingId=${b.id}&customerId=${b.customerId}&amount=${b.remainingBalance}`,
            severity: 'warning',
          });
        }
      });

      // 3. Maintenance Fleet Alerts
      vehicles.forEach((v) => {
        if (v.status === 'maintenance') {
          list.push({
            id: `maint-${v.id}`,
            type: 'maintenance',
            title: 'Fleet Vehicle in Maintenance',
            message: `${v.brand} ${v.model} (${v.registrationNumber}) is in maintenance: "${v.notes || 'Routine check in progress'}".`,
            timestamp: v.updatedAt || v.createdAt,
            isRead: readIds.has(`maint-${v.id}`),
            link: '/vehicles',
            severity: 'alert',
          });
        }
      });

      // 4. Pending Verification Customers
      customers.forEach((c) => {
        if (c.verificationStatus === 'pending' && !c.isArchived) {
          list.push({
            id: `verif-${c.id}`,
            type: 'verification',
            title: 'Customer Verification Required',
            message: `${c.name} (${c.phone}) registered and requires document / driving license verification.`,
            timestamp: c.createdAt,
            isRead: readIds.has(`verif-${c.id}`),
            link: '/customers',
            severity: 'info',
          });
        }
      });

      // Sort notifications: unread first, then by timestamp
      list.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Filter out permanently dismissed ones
      setNotifications(list.filter((n) => !dismissedIds.has(n.id)));
    } catch (err) {
      console.warn('Failed to compile notifications:', err);
    }
  }, [readIds, dismissedIds]);

  useEffect(() => {
    refreshNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismissNotification = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
