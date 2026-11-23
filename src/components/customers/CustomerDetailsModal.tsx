import React, { useState, useEffect } from 'react';
import { Customer, Booking, Payment } from '../../types';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '../../lib/utils';
import { Phone, Mail, MapPin, Calendar, PlusCircle, CreditCard, History } from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onBookNow: (customerId: string) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onBookNow,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      setLoading(true);
      Promise.all([
        bookingService.getByCustomer(customer.id),
        paymentService.getByCustomer(customer.id),
      ])
        .then(([b, p]) => {
          setBookings(b);
          setPayments(p);
        })
        .finally(() => setLoading(false));
    }
  }, [customer, isOpen]);

  if (!customer) return null;

  const totalSpent = payments
    .filter((p) => p.paymentType !== 'security_deposit' && p.paymentType !== 'refund')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile" size="lg">
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-800/40">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-lg border border-emerald-500/30">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                <StatusBadge status={customer.verificationStatus} type="verification" />
                {customer.isArchived && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">ID: {customer.id}</p>
            </div>
          </div>
          <Button
            size="sm"
            icon={<PlusCircle size={16} />}
            onClick={() => {
              onClose();
              onBookNow(customer.id);
            }}
          >
            New Booking
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <History size={15} />
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard size={15} />
            Payments ({payments.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <Phone size={18} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400">Primary Phone</p>
                      <p className="text-sm font-medium text-white">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <Phone size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400">Emergency / Alt Phone</p>
                      <p className="text-sm font-medium text-white">
                        {customer.alternatePhone || customer.email || 'None'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/60 sm:col-span-2">
                    <MapPin size={18} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400">Address</p>
                      <p className="text-sm font-medium text-white">{customer.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <Calendar size={18} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400">Registered On</p>
                      <p className="text-sm font-medium text-white">{formatDate(customer.registrationDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <CreditCard size={18} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400">Total Spent</p>
                      <p className="text-sm font-medium text-white">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </div>

                {customer.notes && (
                  <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <p className="text-xs text-neutral-400 mb-1">Notes & Documents</p>
                    <p className="text-sm text-neutral-300 whitespace-pre-line">{customer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No bookings found for this customer.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-800/60 text-xs text-neutral-400">
                        <tr>
                          <th className="p-3">Booking ID</th>
                          <th className="p-3">Vehicle</th>
                          <th className="p-3">Dates</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-neutral-800/30">
                            <td className="p-3 font-mono text-xs">{b.id}</td>
                            <td className="p-3 font-medium text-white">{b.vehicleName}</td>
                            <td className="p-3 text-xs">
                              {formatDate(b.pickupDate)} - {formatDate(b.returnDate)} ({b.rentalDuration}d)
                            </td>
                            <td className="p-3">{formatCurrency(b.rentalAmount)}</td>
                            <td className="p-3">
                              <StatusBadge status={b.status} type="booking" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No payments recorded for this customer.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-800/60 text-xs text-neutral-400">
                        <tr>
                          <th className="p-3">ID / Ref</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-800/30">
                            <td className="p-3">
                              <div className="font-mono text-xs">{p.id}</div>
                              <div className="text-[11px] text-neutral-500">{p.transactionReference}</div>
                            </td>
                            <td className="p-3 capitalize">{p.paymentType.replace('_', ' ')}</td>
                            <td className="p-3 uppercase text-xs">{p.paymentMethod}</td>
                            <td className="p-3 text-xs">{formatDate(p.paymentDate)}</td>
                            <td className="p-3 font-medium text-white">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
