export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled' | 'pending';

export interface BookingVehicleItem {
  vehicleId: string;
  vehicleName: string;
  odometerReading?: number;
  rentalPrice?: number;
  securityDeposit?: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleName: string;
  vehicles?: BookingVehicleItem[];
  odometerReading?: number;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalDuration: number;
  rentalAmount: number;
  securityDeposit: number;
  advancePayment: number;
  remainingBalance: number;
  status: BookingStatus;
  notes: string;
  images?: string[];
  drivingLicensePhoto?: string;
  rentalAgreementPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData {
  id?: string;
  customerId: string;
  vehicleId?: string;
  vehicles?: BookingVehicleItem[];
  odometerReading?: number;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalAmount: number;
  securityDeposit: number;
  advancePayment: number;
  status?: BookingStatus;
  notes: string;
  images?: string[];
  drivingLicensePhoto?: string;
  rentalAgreementPhoto?: string;
}
