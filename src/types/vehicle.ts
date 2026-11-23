export type VehicleStatus = 'available' | 'reserved' | 'rented' | 'maintenance' | 'inactive';

export type VehicleCategory = 'Scooter' | 'Motorcycle' | 'Sport' | 'Cruiser' | 'Electric';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  category: VehicleCategory;
  rentalPrice: number;
  securityDeposit: number;
  status: VehicleStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  registrationNumber: string;
  brand: string;
  model: string;
  category: VehicleCategory;
  rentalPrice: number;
  securityDeposit: number;
  status: VehicleStatus;
  notes: string;
}
