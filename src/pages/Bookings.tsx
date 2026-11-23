import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../hooks/useBookings';
import { useCustomers } from '../hooks/useCustomers';
import { useVehicles } from '../hooks/useVehicles';
import { Booking, BookingFormData } from '../types';
import { BookingModal } from '../components/bookings/BookingModal';
import { BookingDetailsModal } from '../components/bookings/BookingDetailsModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { StatusBadge } from '../components/shared/StatusBadge';
import { SearchBar } from '../components/shared/SearchBar';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, getInitials } from '../lib/utils';
import {
  CalendarCheck,
  Plus,
  Bike,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  XCircle,
  CreditCard,
  Calendar,
} from 'lucide-react';

export const Bookings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { bookings, loading, createBooking, updateBooking, cancelBooking } = useBookings();
  const { customers, refresh: refreshCustomers, createCustomer } = useCustomers();
  const { vehicles } = useVehicles();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [initialCustomerId, setInitialCustomerId] = useState<string | undefined>(undefined);

  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // Handle URL query parameters (?action=new, ?view=..., ?filter=returns, ?customerId=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const customerId = searchParams.get('customerId');
    const viewId = searchParams.get('view');
    const filter = searchParams.get('filter');

    if (action === 'new') {
      setEditingBooking(null);
      if (customerId) setInitialCustomerId(customerId);
      setIsFormOpen(true);
      searchParams.delete('action');
      searchParams.delete('customerId');
      setSearchParams(searchParams, { replace: true });
    }

    if (viewId && bookings.length > 0) {
      const found = bookings.find((b) => b.id === viewId);
      if (found) {
        setDetailsBooking(found);
        setIsDetailsOpen(true);
      }
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }

    if (filter === 'returns') {
      setStatusFilter('active');
      searchParams.delete('filter');
      setSearchParams(searchParams, { replace: true });
    } else if (filter === 'pending') {
      setStatusFilter('pending');
      searchParams.delete('filter');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, bookings]);

  // Computed metrics
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === 'active').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const pendingPaymentsCount = bookings.filter((b) => b.remainingBalance > 0 && b.status !== 'cancelled').length;

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Filter by status
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.vehicleName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const handleFormSubmit = async (data: BookingFormData) => {
    if (editingBooking) {
      await updateBooking(editingBooking.id, data);
    } else {
      await createBooking(data);
    }
    setIsFormOpen(false);
    setEditingBooking(null);
  };

  const handleCancelClick = (booking: Booking) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel booking ${booking.id} for ${booking.customerName}? The vehicle will be made available for other bookings.`,
      confirmLabel: 'Yes, Cancel Booking',
      variant: 'danger',
      onConfirm: async () => {
        await cancelBooking(booking.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
    await updateBooking(bookingId, { status });
  };

  const handleRecordPayment = (booking: Booking) => {
    navigate(`/payments?action=new&bookingId=${booking.id}&customerId=${booking.customerId}&amount=${booking.remainingBalance}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track rentals, check schedules, and ensure zero duplicate reservations.
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingBooking(null);
            setInitialCustomerId(undefined);
            setIsFormOpen(true);
          }}
        >
          New Booking
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Bookings</span>
            <CalendarCheck size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalBookings}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Active On Road</span>
            <Bike size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{activeBookings}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Pending Inquiries</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{pendingBookings}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Balance Outstanding</span>
            <CreditCard size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{pendingPaymentsCount}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by ID, customer, phone, vehicle..."
          className="w-full md:w-96"
        />

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'active', label: 'Active' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={32} />}
            title={searchQuery ? 'No bookings match your search' : 'No bookings found'}
            description={
              searchQuery
                ? 'Try adjusting your search criteria or filter options.'
                : 'Create your first rental booking to start tracking rides.'
            }
            action={
              !searchQuery && (
                <Button
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingBooking(null);
                    setIsFormOpen(true);
                  }}
                >
                  New Booking
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Booking ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Vehicle</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5">Rental Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-800/25 transition-colors group cursor-pointer"
                    onClick={() => {
                      setDetailsBooking(b);
                      setIsDetailsOpen(true);
                    }}
                  >
                    {/* Booking ID Column */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-neutral-200 bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-700/60">
                        {b.id}
                      </span>
                    </td>

                    {/* Customer Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1c1c1c] text-sm font-semibold text-neutral-300 border border-neutral-800">
                          {getInitials(b.customerName)}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {b.customerName}
                          </div>
                          <div className="text-xs text-neutral-400">{b.customerPhone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{b.vehicleName}</span>
                        {b.vehicles && b.vehicles.length > 1 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 shrink-0">
                            {b.vehicles.length} Vehicles
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
                        {b.vehicles && b.vehicles.length > 1 ? (
                          b.vehicles.map((v, i) => (
                            <span key={i} className="font-mono text-[11px]">
                              {v.odometerReading !== undefined && v.odometerReading > 0 ? (
                                <span className="text-emerald-400/90">{v.odometerReading.toLocaleString()} km</span>
                              ) : (
                                v.vehicleId
                              )}
                              {i < (b.vehicles?.length || 0) - 1 ? ' • ' : ''}
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="font-mono">{b.vehicleId}</span>
                            {b.odometerReading !== undefined && b.odometerReading > 0 && (
                              <span className="text-emerald-400 font-mono">
                                • {b.odometerReading.toLocaleString()} km
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-neutral-200">
                        {b.rentalDuration} day{b.rentalDuration !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {b.pickupTime} - {b.returnTime}
                      </div>
                    </td>

                    {/* Rental Amount */}
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {formatCurrency(b.rentalAmount)}
                      <div className="text-xs font-normal text-neutral-500">
                        Deposit: {formatCurrency(b.securityDeposit)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={b.status} type="booking" />
                    </td>

                    {/* Actions */}
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setDetailsBooking(b);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setEditingBooking(b);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Booking"
                        >
                          <Edit2 size={16} />
                        </button>

                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelClick(b)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Cancel Booking"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBooking(null);
        }}
        onSubmit={handleFormSubmit}
        booking={editingBooking}
        customers={customers.filter((c) => !c.isArchived)}
        vehicles={vehicles}
        initialCustomerId={initialCustomerId}
        onCreateCustomer={createCustomer}
        onCustomerCreated={refreshCustomers}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsBooking(null);
        }}
        booking={detailsBooking}
        onEdit={(b) => {
          setEditingBooking(b);
          setIsFormOpen(true);
        }}
        onCancel={handleCancelClick}
        onRecordPayment={handleRecordPayment}
        onStatusChange={handleStatusChange}
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

export default Bookings;
