import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentFormData, Customer, Booking, PaymentMethod, PaymentType } from '../../types';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { CreditCard, IndianRupee, ShieldCheck, CheckCircle2 } from 'lucide-react';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  bookingId: z.string().optional(),
  amount: z.number().min(1, 'Payment amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'other']),
  transactionReference: z.string().min(2, 'Transaction reference or receipt number is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentType: z.enum(['rental', 'security_deposit', 'refund', 'advance', 'balance']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  customers: Customer[];
  bookings: Booking[];
  initialBookingId?: string;
  initialCustomerId?: string;
  initialAmount?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  bookings,
  initialBookingId,
  initialCustomerId,
  initialAmount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: initialCustomerId || '',
      bookingId: initialBookingId || '',
      amount: initialAmount || 500,
      paymentMethod: 'upi',
      transactionReference: `TXN-${Date.now().toString(36).toUpperCase()}`,
      paymentDate: todayStr,
      paymentType: initialBookingId ? 'balance' : 'rental',
      notes: '',
    },
  });

  const selectedBookingId = watch('bookingId');
  const selectedCustomerId = watch('customerId');
  const paymentType = watch('paymentType');
  const amount = watch('amount') || 0;

  // Selected booking info
  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId);
  }, [bookings, selectedBookingId]);

  // When selected booking changes, auto-fill customer and remaining balance
  const handleBookingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setValue('bookingId', bId);
    const bk = bookings.find((b) => b.id === bId);
    if (bk) {
      setValue('customerId', bk.customerId);
      if (bk.remainingBalance > 0) {
        setValue('amount', bk.remainingBalance);
        setValue('paymentType', 'balance');
      } else {
        setValue('paymentType', 'security_deposit');
        setValue('amount', bk.securityDeposit);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const generatedRef = `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      reset({
        customerId: initialCustomerId || (bookings.find(b => b.id === initialBookingId)?.customerId || ''),
        bookingId: initialBookingId || '',
        amount: initialAmount !== undefined && initialAmount > 0 ? initialAmount : 1000,
        paymentMethod: 'upi',
        transactionReference: generatedRef,
        paymentDate: todayStr,
        paymentType: initialBookingId ? 'balance' : 'rental',
        notes: '',
      });
    }
  }, [isOpen, initialBookingId, initialCustomerId, initialAmount, reset, bookings]);

  const onFormSubmit = async (data: FormValues) => {
    await onSubmit({
      customerId: data.customerId,
      bookingId: data.bookingId || '',
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod as PaymentMethod,
      transactionReference: data.transactionReference.trim(),
      paymentDate: data.paymentDate,
      paymentType: data.paymentType as PaymentType,
      notes: data.notes || '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Booking Selection (Optional/Recommended) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-300">
            Linked Booking (Optional)
          </label>
          <select
            value={selectedBookingId}
            onChange={handleBookingSelect}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors"
          >
            <option value="">No specific booking (Direct deposit/fee)</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.customerName} ({b.vehicleName}) — Due: {formatCurrency(b.remainingBalance)}
              </option>
            ))}
          </select>
          {selectedBooking && (
            <div className="text-xs p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/60 text-neutral-300 flex justify-between">
              <span>Rental: {formatCurrency(selectedBooking.rentalAmount)}</span>
              <span>Paid: {formatCurrency(selectedBooking.advancePayment)}</span>
              <span className="font-semibold text-amber-400">
                Outstanding: {formatCurrency(selectedBooking.remainingBalance)}
              </span>
            </div>
          )}
        </div>

        {/* Customer */}
        <Select
          label="Customer *"
          options={customers.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.phone})`,
          }))}
          {...register('customerId')}
          error={errors.customerId?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount */}
          <Input
            label="Payment Amount (₹) *"
            type="number"
            placeholder="e.g. 1500"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />

          {/* Payment Type */}
          <Select
            label="Payment Type *"
            options={Object.entries(PAYMENT_TYPE_LABELS).map(([val, lbl]) => ({
              value: val,
              label: lbl,
            }))}
            {...register('paymentType')}
            error={errors.paymentType?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Method */}
          <Select
            label="Payment Method *"
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([val, lbl]) => ({
              value: val,
              label: lbl,
            }))}
            {...register('paymentMethod')}
            error={errors.paymentMethod?.message}
          />

          {/* Date */}
          <Input
            label="Payment Date *"
            type="date"
            {...register('paymentDate')}
            error={errors.paymentDate?.message}
          />
        </div>

        {/* Transaction Reference */}
        <Input
          label="Transaction Ref / UPI / Receipt #"
          placeholder="e.g. UPI/2026/887982, CASH-REC-01"
          {...register('transactionReference')}
          error={errors.transactionReference?.message}
        />

        {/* Notes */}
        <Textarea
          label="Payment Notes"
          placeholder="e.g. Received via GPay, Cash handed to store manager..."
          {...register('notes')}
          error={errors.notes?.message}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Record Payment Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
