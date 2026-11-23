import { StorageService } from './storage';
import { Payment, PaymentFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';
import { customerService } from './customerService';
import { bookingService } from './bookingService';

const storage = new StorageService<Payment>(STORAGE_KEYS.PAYMENTS);

export const paymentService = {
  async getAll(): Promise<Payment[]> {
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
