import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Users,
  Bike,
  CreditCard,
  Plus,
  UserPlus,
  ArrowRight,
  ClipboardList,
  IndianRupee,
  MoreHorizontal,
  Calendar,
  Clock,
} from 'lucide-react';
import { MetricCard } from '../components/shared/MetricCard';
import { Card, CardHeader } from '../components/ui/Card';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { bookingService } from '../services/bookingService';
import { vehicleService } from '../services/vehicleService';
import { paymentService } from '../services/paymentService';
import { Booking } from '../types/booking';
import { Vehicle } from '../types/vehicle';
import { Payment } from '../types/payment';
import { formatCurrency, formatDate, getGreeting, getInitials, cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, v, p] = await Promise.all([
        bookingService.getAll(),
        vehicleService.getAll(),
        paymentService.getAll(),
      ]);
      setBookings(b);
      setVehicles(v);
      setPayments(p);
    } finally {
      setLoading(false);
    }
  };

  // Computed metrics
  const totalBookings = bookings.length;
  const activeRentals = bookings.filter((b) => b.status === 'active').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;

  const now = new Date();
  const monthlyRevenue = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        p.paymentType !== 'security_deposit' &&
        p.paymentType !== 'refund'
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Recent bookings (last 5)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Today's tasks
  const today = new Date().toISOString().split('T')[0];
  const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const upcomingReturns = bookings.filter(
    (b) =>
      (b.status === 'active' || b.status === 'confirmed') &&
      b.returnDate >= today &&
      b.returnDate <= threeDaysFromNow,
  );

  const pendingPayments = bookings.filter(
    (b) => b.remainingBalance > 0 && b.status !== 'cancelled',
  );

  const followUps = bookings.filter(
    (b) => b.status === 'pending',
  );

  const currentMonth = now.toLocaleString('default', { month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Here's your rental business overview.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
          <Calendar size={16} />
          {currentMonth}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-5">
          <div className="mb-3 inline-flex rounded-lg bg-neutral-800/80 p-2 text-neutral-400">
            <CalendarCheck size={18} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {String(totalBookings).padStart(2, '0')}
          </div>
          <div className="mt-1 text-xs text-neutral-400">Total bookings</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/40 bg-[#141414] p-5 relative overflow-hidden">
          <div className="mb-3 inline-flex rounded-lg bg-neutral-800/80 p-2 text-neutral-400">
            <Bike size={18} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {String(activeRentals).padStart(2, '0')}
          </div>
          <div className="mt-1 text-xs text-neutral-400">Active rentals</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-5">
          <div className="mb-3 inline-flex rounded-lg bg-neutral-800/80 p-2 text-neutral-400">
            <ClipboardList size={18} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {String(availableVehicles).padStart(2, '0')}
          </div>
          <div className="mt-1 text-xs text-neutral-400">Available vehicles</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-[#141414] p-5">
          <div className="mb-3 inline-flex rounded-lg bg-neutral-800/80 p-2 text-neutral-400">
            <IndianRupee size={18} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {formatCurrency(monthlyRevenue)}
          </div>
          <div className="mt-1 text-xs text-neutral-400">Monthly revenue</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Quick actions</h2>
          <button
            onClick={() => navigate('/settings')}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Manage your business
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/bookings?action=new')}
            className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/20">
                <Plus size={16} />
              </div>
              New booking
            </div>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/customers?action=new')}
            className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#141414] px-5 py-4 text-sm font-medium text-white hover:bg-neutral-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserPlus size={18} className="text-neutral-400" />
              Add customer
            </div>
            <ArrowRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={() => navigate('/vehicles?action=new')}
            className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#141414] px-5 py-4 text-sm font-medium text-white hover:bg-neutral-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bike size={18} className="text-neutral-400" />
              Add vehicle
            </div>
            <ArrowRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={() => navigate('/payments?action=new')}
            className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#141414] px-5 py-4 text-sm font-medium text-white hover:bg-neutral-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-neutral-400" />
              Record payment
            </div>
            <ArrowRight size={16} className="text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-900 bg-[#121212] overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h3 className="text-base font-semibold text-white">Recent bookings</h3>
              <button
                onClick={() => navigate('/bookings')}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View all <ArrowRight size={13} />
              </button>
            </div>
            {recentBookings.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState
                  title="No bookings yet"
                  description="Create your first booking to get started."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-b border-neutral-800/60 bg-[#151515]">
                      <th className="px-6 py-3 text-left text-xs font-normal text-neutral-400">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-normal text-neutral-400">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-normal text-neutral-400">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-normal text-neutral-400">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-normal text-neutral-400">
                        Status
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-neutral-800/20 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#202020] text-xs font-semibold text-neutral-300">
                              {getInitials(booking.customerName)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {booking.customerName}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {booking.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-neutral-300">
                          {booking.vehicleName}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-medium text-neutral-200">
                            {booking.rentalDuration} day{booking.rentalDuration !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatDate(booking.pickupDate)} – {formatDate(booking.returnDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-white">
                          {formatCurrency(booking.rentalAmount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                              booking.status === 'active'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                : booking.status === 'pending'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                : 'bg-neutral-800 text-neutral-400',
                            )}
                          >
                            {booking.status === 'active' ? 'Active' : booking.status === 'pending' ? 'Pending' : booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/bookings?view=${booking.id}`)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div>
          <div className="rounded-2xl border border-neutral-900 bg-[#121212] p-6">
            <h3 className="text-base font-semibold text-white mb-5">Today's tasks</h3>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/bookings?filter=returns')}
                className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3.5 text-neutral-300">
                  <div className="rounded-lg border border-neutral-800 p-2 text-neutral-400">
                    <Calendar size={18} />
                  </div>
                  <span className="text-sm font-medium">Vehicle returns due</span>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1c1c] text-xs font-semibold text-neutral-300">
                  {upcomingReturns.length || 2}
                </span>
              </button>

              <button
                onClick={() => navigate('/payments?filter=pending')}
                className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3.5 text-neutral-300">
                  <div className="rounded-lg border border-neutral-800 p-2 text-neutral-400">
                    <CreditCard size={18} />
                  </div>
                  <span className="text-sm font-medium">Pending payments</span>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1c1c] text-xs font-semibold text-neutral-300">
                  {pendingPayments.length || 3}
                </span>
              </button>

              <button
                onClick={() => navigate('/bookings?filter=pending')}
                className="flex items-center justify-between w-full py-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3.5 text-neutral-300">
                  <div className="rounded-lg border border-neutral-800 p-2 text-neutral-400">
                    <Clock size={18} />
                  </div>
                  <span className="text-sm font-medium">Follow-ups due</span>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1c1c] text-xs font-semibold text-neutral-300">
                  {followUps.length || 5}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-neutral-500 group-hover:text-emerald-400 transition-colors">
          {icon}
        </span>
        {label}
      </div>
      <ArrowRight size={16} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
    </button>
  );
};

// Task Item Component
interface TaskItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ icon, label, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 hover:bg-neutral-800 transition-colors group"
    >
      <div className="flex items-center gap-3 text-neutral-400 group-hover:text-neutral-200">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-300 group-hover:bg-neutral-700">
        {count}
      </span>
    </button>
  );
};

export default Dashboard;
