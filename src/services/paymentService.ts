import { StorageService } from './storage';
import { Payment, PaymentFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';
import { customerService } from './customerService';
import { bookingService } from './bookingService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const storage = new StorageService<Payment>(STORAGE_KEYS.PAYMENTS);

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*, customers(custom_id, name), bookings(custom_id)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Payment[] = data.map((p: any) => ({
            id: p.custom_id,
            customerId: p.customers?.custom_id || p.customer_id,
            customerName: p.customers?.name || '',
            bookingId: p.bookings?.custom_id || p.booking_id || undefined,
            amount: Number(p.amount),
            paymentMethod: p.payment_method,
            transactionReference: p.transaction_reference,
            paymentDate: p.payment_date,
            paymentType: p.payment_type,
            notes: p.notes || undefined,
            createdAt: p.created_at,
          }));
          storage.save(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase payments fetch notice:', err);
      }
    }
    return storage.getAll();
  },

  async getById(id: string): Promise<Payment | undefined> {
    return storage.getById(id);
  },

  async getByBooking(bookingId: string): Promise<Payment[]> {
    return storage.query((p) => p.bookingId === bookingId);
  },

  async getByCustomer(customerId: string): Promise<Payment[]> {
    return storage.query((p) => p.customerId === customerId);
  },

  async create(data: PaymentFormData): Promise<Payment> {
    const customer = await customerService.getById(data.customerId);
    const payment: Payment = {
      id: generateId('PY'),
      ...data,
      customerName: customer?.name || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await storage.create(payment);

    if (isSupabaseConfigured) {
      try {
        const { data: dbCustomer } = await supabase.from('customers').select('id').eq('custom_id', payment.customerId).single();
        let dbBookingId = null;
        if (payment.bookingId) {
          const { data: dbBooking } = await supabase.from('bookings').select('id').eq('custom_id', payment.bookingId).single();
          dbBookingId = dbBooking?.id || null;
        }
        if (dbCustomer) {
          await supabase.from('payments').insert({
            custom_id: payment.id,
            customer_id: dbCustomer.id,
            booking_id: dbBookingId,
            amount: payment.amount,
            payment_method: payment.paymentMethod,
            transaction_reference: payment.transactionReference,
            payment_date: payment.paymentDate,
            payment_type: payment.paymentType,
            notes: payment.notes || null,
            created_at: payment.createdAt,
          });
        }
      } catch (err) {
        console.warn('Supabase payment insert notice:', err);
      }
    }

    // If payment is for a booking and contributes to the rental balance
    if (data.bookingId && (data.paymentType === 'balance' || data.paymentType === 'rental' || data.paymentType === 'advance')) {
      const booking = await bookingService.getById(data.bookingId);
      if (booking) {
        const newBalance = Math.max(0, booking.remainingBalance - data.amount);
        const newAdvance = booking.advancePayment + data.amount;
        await bookingService.update(data.bookingId, {
          advancePayment: newAdvance,
          remainingBalance: newBalance,
        } as any);
      }
    }

    return saved;
  },

  async delete(id: string): Promise<boolean> {
    const payment = await storage.getById(id);
    if (!payment) return false;

    // Restore booking balance if this was a rental/balance payment
    if (payment.bookingId && (payment.paymentType === 'balance' || payment.paymentType === 'rental' || payment.paymentType === 'advance')) {
      const booking = await bookingService.getById(payment.bookingId);
      if (booking) {
        const newBalance = booking.remainingBalance + payment.amount;
        const newAdvance = Math.max(0, booking.advancePayment - payment.amount);
        await bookingService.update(payment.bookingId, {
          advancePayment: newAdvance,
          remainingBalance: newBalance,
        } as any);
      }
    }

    return storage.delete(id);
  },

  async search(query: string): Promise<Payment[]> {
    const q = query.toLowerCase();
    return storage.query(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.bookingId.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q),
    );
  },

  async getMonthlyRevenue(year: number, month: number): Promise<number> {
    const payments = await storage.getAll();
    return payments
      .filter((p) => {
        const date = new Date(p.paymentDate);
        return date.getFullYear() === year && date.getMonth() === month && p.paymentType !== 'security_deposit' && p.paymentType !== 'refund';
      })
      .reduce((sum, p) => sum + p.amount, 0);
  },
};
