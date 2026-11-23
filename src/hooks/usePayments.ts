import { useState, useEffect, useCallback } from 'react';
import { Payment, PaymentFormData } from '../types';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAll();
      setPayments(data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = async (data: PaymentFormData) => {
    try {
      const created = await paymentService.create(data);
      toast.success(`Payment of ₹${created.amount.toLocaleString('en-IN')} recorded!`);
      await fetchPayments();
      return created;
    } catch {
      toast.error('Failed to record payment');
      throw new Error('Record payment failed');
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await paymentService.delete(id);
      toast.success('Payment entry removed');
      await fetchPayments();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  return {
    payments,
    loading,
    refresh: fetchPayments,
    createPayment,
    deletePayment,
  };
}
