import React, { useState, useMemo } from 'react';
import { useBookings } from '../hooks/useBookings';
import { usePayments } from '../hooks/usePayments';
import { useVehicles } from '../hooks/useVehicles';
import { useCustomers } from '../hooks/useCustomers';
import { exportToCSV } from '../lib/csvExport';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  Bike,
  ShieldCheck,
  TrendingUp,
  PieChart,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { bookings, loading: bookingsLoading } = useBookings();
  const { payments, loading: paymentsLoading } = usePayments();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();

  // Date filter state
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_month' | 'last_30' | 'this_year'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter bookings and payments based on date range
  const { filteredBookings, filteredPayments } = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();

    if (dateRangePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateRangePreset === 'last_30') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
    } else if (dateRangePreset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (startDate || endDate) {
      if (startDate) start = new Date(startDate);
      if (endDate) end = new Date(endDate + 'T23:59:59');
    }

    const fb = bookings.filter((b) => {
      if (!start && !end) return true;
      const bDate = new Date(b.pickupDate);
      if (start && bDate < start) return false;
      if (end && bDate > end) return false;
      return true;
    });

    const fp = payments.filter((p) => {
      if (!start && !end) return true;
      const pDate = new Date(p.paymentDate);
      if (start && pDate < start) return false;
      if (end && pDate > end) return false;
      return true;
    });

    return { filteredBookings: fb, filteredPayments: fp };
  }, [bookings, payments, dateRangePreset, startDate, endDate]);

  // Computed Report Metrics
  const totalBookings = filteredBookings.length;
  const completedBookings = filteredBookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = filteredBookings.filter((b) => b.status === 'cancelled').length;
  const activeBookings = filteredBookings.filter((b) => b.status === 'active').length;
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  // Revenue metrics
  const totalRevenue = filteredPayments
    .filter((p) => p.paymentType !== 'security_deposit' && p.paymentType !== 'refund')
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingPayments = filteredBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.remainingBalance, 0);

  const securityDepositsHeld = filteredPayments
    .filter((p) => p.paymentType === 'security_deposit')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundsIssued = filteredPayments
    .filter((p) => p.paymentType === 'refund')
    .reduce((sum, p) => sum + p.amount, 0);

  // Vehicle utilization = (Rented + Active vehicles) / Total Fleet
  const vehicleUtilization = useMemo(() => {
    if (vehicles.length === 0) return 0;
    const busy = vehicles.filter((v) => v.status === 'rented').length;
    return Math.round((busy / vehicles.length) * 100);
  }, [vehicles]);

  // Payment method breakdown
  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, number> = { upi: 0, cash: 0, card: 0, bank_transfer: 0, other: 0 };
    filteredPayments.forEach((p) => {
      if (p.paymentType !== 'refund') {
        stats[p.paymentMethod] = (stats[p.paymentMethod] || 0) + p.amount;
      }
    });
    return stats;
  }, [filteredPayments]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const v = vehicles.find((veh) => veh.id === b.vehicleId);
      const cat = v?.category || 'Other';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, [filteredBookings, vehicles]);

  // Top vehicles by revenue & rentals
  const vehiclePerformance = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; reg: string; count: number; revenue: number }>();
    filteredBookings.forEach((b) => {
      const existing = map.get(b.vehicleId) || {
        brand: b.vehicleName,
        model: '',
        reg: b.vehicleId,
        count: 0,
        revenue: 0,
      };
      existing.count += 1;
      existing.revenue += b.rentalAmount;
      map.set(b.vehicleId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredBookings]);

  // CSV Export Handlers
  const handleExportBookings = () => {
    const rows = filteredBookings.map((b) => ({
      'Booking ID': b.id,
      'Customer Name': b.customerName,
      'Customer Phone': b.customerPhone,
      'Vehicle': b.vehicleName,
      'Vehicle ID': b.vehicleId,
      'Pickup Date': b.pickupDate,
      'Pickup Time': b.pickupTime,
      'Return Date': b.returnDate,
      'Return Time': b.returnTime,
      'Duration (Days)': b.rentalDuration,
      'Rental Amount (INR)': b.rentalAmount,
      'Security Deposit (INR)': b.securityDeposit,
      'Advance Paid (INR)': b.advancePayment,
      'Balance Due (INR)': b.remainingBalance,
      'Status': b.status,
      'Created At': b.createdAt,
    }));
    exportToCSV(`meq_wheels_bookings_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleExportPayments = () => {
    const rows = filteredPayments.map((p) => ({
      'Payment ID': p.id,
      'Customer Name': p.customerName,
      'Customer ID': p.customerId,
      'Linked Booking ID': p.bookingId,
      'Amount (INR)': p.amount,
      'Payment Type': p.paymentType,
      'Payment Method': p.paymentMethod,
      'Transaction Reference': p.transactionReference,
      'Payment Date': p.paymentDate,
      'Notes': p.notes,
    }));
    exportToCSV(`meq_wheels_payments_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleExportSummary = () => {
    const summary = [
      { Metric: 'Total Bookings', Value: totalBookings },
      { Metric: 'Completed Bookings', Value: completedBookings },
      { Metric: 'Cancelled Bookings', Value: cancelledBookings },
      { Metric: 'Active Rentals', Value: activeBookings },
      { Metric: 'Total Revenue (INR)', Value: totalRevenue },
      { Metric: 'Outstanding Balance (INR)', Value: outstandingPayments },
      { Metric: 'Net Security Deposits Held (INR)', Value: securityDepositsHeld - refundsIssued },
      { Metric: 'Fleet Utilization (%)', Value: `${vehicleUtilization}%` },
    ];
    exportToCSV(`meq_wheels_summary_${new Date().toISOString().split('T')[0]}`, summary);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Reports & Analytics</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track revenue, completion ratios, fleet utilization, and export financial data.
          </p>
        </div>

        {/* CSV Export Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={14} />}
            onClick={handleExportSummary}
          >
            Export Summary
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={14} />}
            onClick={handleExportBookings}
          >
            Export Bookings CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Download size={14} />}
            onClick={handleExportPayments}
          >
            Export Payments CSV
          </Button>
        </div>
      </div>

      {/* Date Filters Bar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-neutral-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Calendar size={14} /> Timeframe:
          </span>
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30', label: 'Last 30 Days' },
              { id: 'this_year', label: 'This Year' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setDateRangePreset(preset.id);
                setStartDate('');
                setEndDate('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                dateRangePreset === preset.id && !startDate && !endDate
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setDateRangePreset('all');
            }}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
          />
          <span className="text-xs text-neutral-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDateRangePreset('all');
            }}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setDateRangePreset('all');
              }}
              className="text-xs text-neutral-500 hover:text-white ml-1 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <BarChart3 size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalBookings}</div>
          <div className="text-xs text-neutral-500 flex gap-2">
            <span>{activeBookings} active</span> • <span>{completedBookings} completed</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-emerald-500/30 bg-neutral-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Rental Revenue</span>
            <IndianRupee size={18} />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-neutral-500">Excludes security deposits</div>
        </div>

        {/* Outstanding Payments */}
        <div className="rounded-xl border border-amber-500/30 bg-neutral-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Due</span>
            <Clock size={18} />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            {formatCurrency(outstandingPayments)}
          </div>
          <div className="text-xs text-neutral-500">From ongoing/unsettled bookings</div>
        </div>

        {/* Vehicle Utilization */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Utilization</span>
            <Bike size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white">{vehicleUtilization}%</div>
          <div className="text-xs text-neutral-500">
            {vehicles.filter((v) => v.status === 'rented').length} of {vehicles.length} vehicles on rent
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Completed Bookings */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Completed Rentals</span>
            <div className="text-xl font-bold text-white mt-1">{completedBookings}</div>
            <p className="text-xs text-neutral-500 mt-0.5">{completionRate}% completion rate</p>
          </div>
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Cancelled Bookings */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Cancelled Bookings</span>
            <div className="text-xl font-bold text-neutral-300 mt-1">{cancelledBookings}</div>
            <p className="text-xs text-neutral-500 mt-0.5">{cancellationRate}% cancellation rate</p>
          </div>
          <div className="p-3 rounded-full bg-red-500/10 text-red-400">
            <XCircle size={20} />
          </div>
        </div>

        {/* Security Deposits */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Security Deposits Held</span>
            <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
              {formatCurrency(securityDepositsHeld - refundsIssued)}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{formatCurrency(securityDepositsHeld)} in, {formatCurrency(refundsIssued)} refunded</p>
          </div>
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Analytical Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Collections by Payment Method
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              Total: {formatCurrency(Object.values(paymentMethodStats).reduce((a, b) => a + b, 0))}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(paymentMethodStats).map(([method, amount]) => {
              const total = Object.values(paymentMethodStats).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((amount / total) * 100);
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-neutral-300 font-medium">
                      {method.replace('_', ' ')}
                    </span>
                    <span className="text-white font-mono font-semibold">
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rentals by Category */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart size={16} className="text-emerald-400" />
            Rentals by Vehicle Category
          </h3>

          <div className="space-y-3 pt-1">
            {Object.keys(categoryStats).length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No rentals recorded in this timeframe.</p>
            ) : (
              Object.entries(categoryStats).map(([cat, count]) => {
                const total = totalBookings || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-300 font-medium">{cat}</span>
                      <span className="text-white font-mono font-semibold">
                        {count} rentals ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Vehicles Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white">Top Performing Fleet Assets</h3>
        </div>
        {vehiclePerformance.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">No vehicle rental data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-800/60 text-xs text-neutral-400">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-4 py-3">Asset ID</th>
                  <th className="px-4 py-3">Total Rentals</th>
                  <th className="px-6 py-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {vehiclePerformance.map((vp, idx) => (
                  <tr key={vp.reg} className="hover:bg-neutral-800/25">
                    <td className="px-6 py-3.5 font-medium text-white flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500">#{idx + 1}</span>
                      {vp.brand}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-neutral-400">{vp.reg}</td>
                    <td className="px-4 py-3.5">{vp.count} bookings</td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-emerald-400">
                      {formatCurrency(vp.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
