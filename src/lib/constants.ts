export const STORAGE_KEYS = {
  BOOKINGS: 'meq_bookings',
  CUSTOMERS: 'meq_customers',
  VEHICLES: 'meq_vehicles',
  PAYMENTS: 'meq_payments',
  SETTINGS: 'meq_settings',
} as const;

export const BOOKING_STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  completed: { label: 'Completed', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  pending: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
} as const;

export const VEHICLE_STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  reserved: { label: 'Reserved', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  rented: { label: 'Rented', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
} as const;

export const VERIFICATION_STATUS_CONFIG = {
  verified: { label: 'Verified', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  pending: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  other: 'Other',
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  rental: 'Rental Payment',
  security_deposit: 'Security Deposit',
  refund: 'Refund',
  advance: 'Advance Payment',
  balance: 'Balance Payment',
};

export const VEHICLE_CATEGORIES = ['Scooter', 'Motorcycle', 'Sport', 'Cruiser', 'Electric'] as const;
