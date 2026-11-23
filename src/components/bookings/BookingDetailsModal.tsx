import React, { useState, useEffect } from 'react';
import { Booking, Payment } from '../../types';
import { paymentService } from '../../services/paymentService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import {
  Calendar,
  Clock,
  User,
  Bike,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Camera,
  Eye,
} from 'lucide-react';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onRecordPayment: (booking: Booking) => void;
  onStatusChange: (bookingId: string, status: Booking['status']) => Promise<void>;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  onEdit,
  onCancel,
  onRecordPayment,
  onStatusChange,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      setLoadingPayments(true);
      paymentService
        .getByBooking(booking.id)
        .then(setPayments)
        .finally(() => setLoadingPayments(false));
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking Details — ${booking.id}`}
        size="lg"
      >
      <div className="space-y-6">
        {/* Top Status & Quick Status Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-neutral-400">{booking.id}</span>
              <StatusBadge status={booking.status} type="booking" />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Created on {formatDate(booking.createdAt)}
            </p>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-2">
            {booking.status === 'confirmed' && (
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle size={15} />}
                onClick={async () => {
                  await onStatusChange(booking.id, 'active');
                  onClose();
                }}
              >
                Mark Handed Over (Active)
              </Button>
            )}
            {booking.status === 'active' && (
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle size={15} />}
                onClick={async () => {
                  await onStatusChange(booking.id, 'completed');
                  onClose();
                }}
              >
                Mark Vehicle Returned (Complete)
              </Button>
            )}
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <Button
                size="sm"
                variant="danger"
                icon={<XCircle size={15} />}
                onClick={() => {
                  onClose();
                  onCancel(booking);
                }}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <User size={14} className="text-emerald-400" />
              Customer Details
            </div>
            <div className="pt-1">
              <div className="text-base font-semibold text-white">{booking.customerName}</div>
              <div className="text-sm text-neutral-400">{booking.customerPhone}</div>
              <div className="text-xs font-mono text-neutral-500 mt-1">ID: {booking.customerId}</div>
            </div>
          </div>

          {/* Vehicle Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Bike size={14} className="text-emerald-400" />
                <span>
                  {booking.vehicles && booking.vehicles.length > 1
                    ? `Vehicles Booked (${booking.vehicles.length})`
                    : 'Vehicle Details'}
                </span>
              </span>
              {booking.vehicles && booking.vehicles.length > 1 ? (
                <span className="text-emerald-400 font-mono text-xs normal-case bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  {booking.vehicles.length} Units
                </span>
              ) : booking.odometerReading !== undefined && booking.odometerReading > 0 ? (
                <span className="text-emerald-400 font-mono text-xs normal-case bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  KM: {Number(booking.odometerReading).toLocaleString()}
                </span>
              ) : null}
            </div>

            <div className="pt-1 space-y-2">
              {booking.vehicles && booking.vehicles.length > 0 ? (
                booking.vehicles.map((vItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{vItem.vehicleName || vItem.vehicleId}</div>
                      <div className="text-[11px] font-mono text-neutral-500">{vItem.vehicleId}</div>
                    </div>
                    {vItem.odometerReading !== undefined && vItem.odometerReading > 0 && (
                      <div className="font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px]">
                        {vItem.odometerReading.toLocaleString()} KM
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="text-base font-semibold text-white">{booking.vehicleName}</div>
                  <div className="text-xs font-mono text-neutral-500 mt-1">ID: {booking.vehicleId}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Calendar size={14} className="text-emerald-400" />
              Rental Schedule
            </div>
            <div className="text-xs font-semibold text-emerald-400">
              Total Duration: {booking.rentalDuration} day{booking.rentalDuration !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Pickup Date & Time</p>
              <p className="text-sm font-semibold text-white mt-1">
                {formatDate(booking.pickupDate)} at {booking.pickupTime}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Return Date & Time</p>
              <p className="text-sm font-semibold text-white mt-1">
                {formatDate(booking.returnDate)} at {booking.returnTime}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <CreditCard size={14} className="text-emerald-400" />
              Financial Statement
            </div>
            {booking.remainingBalance > 0 && (
              <Button
                size="sm"
                icon={<CreditCard size={14} />}
                onClick={() => {
                  onClose();
                  onRecordPayment(booking);
                }}
              >
                Record Payment
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Rental Amount</p>
              <p className="text-base font-bold text-white mt-1">{formatCurrency(booking.rentalAmount)}</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Security Deposit</p>
              <p className="text-base font-bold text-neutral-200 mt-1">{formatCurrency(booking.securityDeposit)}</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Advance Paid</p>
              <p className="text-base font-bold text-emerald-400 mt-1">{formatCurrency(booking.advancePayment)}</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
              <p className="text-xs text-neutral-400">Balance Due</p>
              <p
                className={`text-base font-bold font-mono mt-1 ${
                  booking.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(booking.remainingBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Payments History for this Booking */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Payments Received ({payments.length})
          </h4>
          {loadingPayments ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-xs text-neutral-500 italic p-3 border border-neutral-800 rounded-lg">
              No payments recorded for this booking yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-800/60 text-neutral-400">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Reference</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5">{formatDate(p.paymentDate)}</td>
                      <td className="p-2.5 capitalize">{p.paymentType.replace('_', ' ')}</td>
                      <td className="p-2.5 uppercase font-medium">{p.paymentMethod}</td>
                      <td className="p-2.5 font-mono text-[11px] text-neutral-400">{p.transactionReference}</td>
                      <td className="p-2.5 text-right font-semibold text-white">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attached Photos & Documents Gallery */}
        {((booking.images && booking.images.length > 0) ||
          booking.drivingLicensePhoto ||
          booking.rentalAgreementPhoto) && (
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <Camera size={14} className="text-emerald-400" />
                Attached Photos & Documents (
                {booking.images?.length ||
                  (booking.drivingLicensePhoto ? 1 : 0) + (booking.rentalAgreementPhoto ? 1 : 0)}
                )
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
              {(booking.images && booking.images.length > 0
                ? booking.images
                : [booking.drivingLicensePhoto, booking.rentalAgreementPhoto].filter(Boolean) as string[]
              ).map((img, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-neutral-800 h-28 bg-black flex items-center justify-center cursor-pointer"
                  onClick={() =>
                    setPreviewImage({
                      url: img,
                      title: `Attached Image #${idx + 1} — ${booking.customerName}`,
                    })
                  }
                >
                  <img
                    src={img}
                    alt={`Attached ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                    <span className="text-xs font-semibold text-white flex items-center gap-1 bg-neutral-900/90 px-2.5 py-1 rounded-lg border border-neutral-700">
                      <Eye size={13} /> View
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/40 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Notes:</span> {booking.notes}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(booking);
            }}
          >
            Edit Booking
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>

    {/* Image Preview Modal */}
    {previewImage && (
      <Modal
        isOpen={true}
        onClose={() => setPreviewImage(null)}
        title={previewImage.title}
        size="lg"
        zIndex="z-[70]"
      >
        <div className="flex flex-col items-center justify-center p-2 space-y-4">
          <img
            src={previewImage.url}
            alt={previewImage.title}
            className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-neutral-800"
          />
          <div className="flex justify-end w-full pt-2 border-t border-neutral-800">
            <Button size="sm" variant="ghost" onClick={() => setPreviewImage(null)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>
  );
};
