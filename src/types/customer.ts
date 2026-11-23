export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  registrationDate: string;
  verificationStatus: VerificationStatus;
  notes: string;
  drivingLicensePhoto?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  id?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  verificationStatus: VerificationStatus;
  notes: string;
  drivingLicensePhoto?: string;
}
