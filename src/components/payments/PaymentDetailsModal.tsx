import React from 'react';
import { Payment } from '../../types';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CreditCard,
  User,
  Calendar,
  CheckCircle,
  FileText,
  Printer,
  Trash2,
} from 'lucide-react';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onDelete: (payment: Payment) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  payment,
  onDelete,
}) => {
  if (!payment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Receipt — ${payment.id}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Receipt Header Card */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-1 border border-emerald-500/30">
            <CheckCircle size={24} />
          </div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Payment Received
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {formatCurrency(payment.amount)}
          </div>
          <div className="text-xs text-neutral-400">
            {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType} •{' '}
            {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-800">
            <span className="text-neutral-400">Receipt ID</span>
            <span className="font-mono text-white font-semibold">{payment.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-800">
            <span className="text-neutral-400">Customer Name</span>
            <span className="text-white font-medium">{payment.customerName}</span>
          </div>
          {payment.bookingId && (
            <div className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400">Linked Booking ID</span>
              <span className="font-mono text-emerald-400 font-semibold">{payment.bookingId}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-neutral-800">
            <span className="text-neutral-400">Transaction Reference</span>
            <span className="font-mono text-neutral-300">{payment.transactionReference}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-800">
            <span className="text-neutral-400">Payment Date</span>
            <span className="text-neutral-300">{formatDate(payment.paymentDate)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-800">
            <span className="text-neutral-400">Payment Method</span>
            <span className="uppercase text-neutral-300 font-medium">{payment.paymentMethod}</span>
          </div>
          {payment.notes && (
            <div className="py-2 border-b border-neutral-800">
              <span className="text-neutral-400 block mb-1">Notes:</span>
              <span className="text-neutral-300 text-xs italic">{payment.notes}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={15} />}
            onClick={() => {
              onClose();
              onDelete(payment);
            }}
          >
            Delete Payment
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
