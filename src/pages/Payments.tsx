import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePayments } from '../hooks/usePayments';
import { useCustomers } from '../hooks/useCustomers';
import { useBookings } from '../hooks/useBookings';
import { Payment, PaymentFormData } from '../types';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../lib/constants';
import { PaymentModal } from '../components/payments/PaymentModal';
import { PaymentDetailsModal } from '../components/payments/PaymentDetailsModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { SearchBar } from '../components/shared/SearchBar';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, getInitials } from '../lib/utils';
import {
  CreditCard,
  Plus,
  IndianRupee,
  ShieldCheck,
  Clock,
  ArrowDownRight,
  Eye,
  Trash2,
  Receipt,
} from 'lucide-react';

export const Payments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { payments, loading, createPayment, deletePayment } = usePayments();
  const { customers } = useCustomers();
  const { bookings } = useBookings();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailsPayment, setDetailsPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Pre-fill parameters
  const [initialBookingId, setInitialBookingId] = useState<string | undefined>();
  const [initialCustomerId, setInitialCustomerId] = useState<string | undefined>();
  const [initialAmount, setInitialAmount] = useState<number | undefined>();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    variant?: 'danger' | 'primary';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Handle URL query parameters (?action=new, ?bookingId=..., ?customerId=..., ?amount=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const bookingId = searchParams.get('bookingId');
    const customerId = searchParams.get('customerId');
    const amountStr = searchParams.get('amount');

    if (action === 'new' || bookingId) {
      if (bookingId) setInitialBookingId(bookingId);
      if (customerId) setInitialCustomerId(customerId);
      if (amountStr) setInitialAmount(Number(amountStr));
      setIsFormOpen(true);
      searchParams.delete('action');
      searchParams.delete('bookingId');
      searchParams.delete('customerId');
      searchParams.delete('amount');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Computed metrics
  const now = new Date();
  const monthlyRevenue = useMemo(() => {
    return payments
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
  }, [payments]);

  // Security deposits held separately from rental revenue
  const totalSecurityDeposits = useMemo(() => {
    const deposits = payments
      .filter((p) => p.paymentType === 'security_deposit')
      .reduce((sum, p) => sum + p.amount, 0);
    const refunds = payments
      .filter((p) => p.paymentType === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, deposits - refunds);
  }, [payments]);

  // Outstanding balances across all bookings
  const totalOutstandingBalance = useMemo(() => {
    return bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.remainingBalance, 0);
  }, [bookings]);

  // Total collections
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.paymentType !== 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Filter by method
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) {
        return false;
      }

      // Filter by type
      if (typeFilter !== 'all' && p.paymentType !== typeFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.bookingId.toLowerCase().includes(q) ||
          p.transactionReference.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [payments, methodFilter, typeFilter, searchQuery]);

  const handleFormSubmit = async (data: PaymentFormData) => {
    await createPayment(data);
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = (payment: Payment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Payment Record',
      message: `Are you sure you want to delete payment ${payment.id} for ${formatCurrency(payment.amount)}? If linked to a booking, the booking balance will be adjusted.`,
      confirmLabel: 'Delete Receipt',
      variant: 'danger',
      onConfirm: async () => {
        await deletePayment(payment.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track transactions, security deposits, balances, and digital receipts.
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => {
            setInitialBookingId(undefined);
            setInitialCustomerId(undefined);
            setInitialAmount(undefined);
            setIsFormOpen(true);
          }}
        >
          Record Payment
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Monthly Revenue</span>
            <IndianRupee size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(monthlyRevenue)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Excludes security deposits</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Deposits Held</span>
            <ShieldCheck size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">
            {formatCurrency(totalSecurityDeposits)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Tracked separately</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Pending Balances</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {formatCurrency(totalOutstandingBalance)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Across open rentals</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Collected</span>
            <CreditCard size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(totalCollected)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">All time receipts</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by ID, customer, booking, reference..."
          className="w-full md:w-96"
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
          >
            <option value="all">All Methods</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
          >
            <option value="all">All Types</option>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title={searchQuery ? 'No payments match your search' : 'No payments recorded'}
            description={
              searchQuery
                ? 'Try adjusting your search criteria or method filter.'
                : 'Record customer advances, balance clearances, or security deposits.'
            }
            action={
              !searchQuery && (
                <Button
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setInitialBookingId(undefined);
                    setIsFormOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Payment ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Linked Booking</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-800/25 transition-colors group cursor-pointer"
                    onClick={() => {
                      setDetailsPayment(p);
                      setIsDetailsOpen(true);
                    }}
                  >
                    {/* Payment ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-neutral-200 bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-700/60">
                        {p.id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c1c1c] text-xs font-semibold text-neutral-300 border border-neutral-800">
                          {getInitials(p.customerName)}
                        </div>
                        <div className="font-medium text-white group-hover:text-emerald-400 transition-colors text-sm">
                          {p.customerName}
                        </div>
                      </div>
                    </td>

                    {/* Booking ID */}
                    <td className="px-4 py-4 text-sm font-mono text-neutral-300">
                      {p.bookingId ? (
                        <span className="text-emerald-400 font-medium">{p.bookingId}</span>
                      ) : (
                        <span className="text-neutral-500 italic">—</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 text-xs">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-medium ${
                          p.paymentType === 'security_deposit'
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40'
                            : p.paymentType === 'refund'
                            ? 'bg-red-950/80 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {PAYMENT_TYPE_LABELS[p.paymentType] || p.paymentType}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-4 text-xs uppercase font-medium text-neutral-300">
                      {p.paymentMethod}
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-4 text-xs font-mono text-neutral-400 max-w-[140px] truncate">
                      {p.transactionReference}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-neutral-400">
                      {formatDate(p.paymentDate)}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4 text-sm font-bold font-mono text-white">
                      {p.paymentType === 'refund' ? '-' : '+'}
                      {formatCurrency(p.amount)}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setDetailsPayment(p);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="View Receipt"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteConfirm(p)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        customers={customers}
        bookings={bookings}
        initialBookingId={initialBookingId}
        initialCustomerId={initialCustomerId}
        initialAmount={initialAmount}
      />

      {/* Payment Receipt / Details Modal */}
      <PaymentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsPayment(null);
        }}
        payment={detailsPayment}
        onDelete={handleDeleteConfirm}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default Payments;
