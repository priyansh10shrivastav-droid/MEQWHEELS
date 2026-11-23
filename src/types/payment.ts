export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';

export type PaymentType = 'rental' | 'security_deposit' | 'refund' | 'advance' | 'balance';

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  paymentDate: string;
  paymentType: PaymentType;
  notes: string;
  createdAt: string;
}

export interface PaymentFormData {
  customerId: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  paymentDate: string;
  paymentType: PaymentType;
  notes: string;
}
