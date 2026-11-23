export interface BusinessSettings {
  businessName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  logoUrl: string;
  defaultRentalDuration: number;
  defaultSecurityDeposit: number;
  minRentalDuration: number;
  maxRentalDuration: number;
}

export const defaultSettings: BusinessSettings = {
  businessName: 'MEQ Wheels',
  tagline: 'Ride Your Way.',
  contactEmail: '',
  contactPhone: '',
  address: '',
  currency: 'INR',
  currencySymbol: '₹',
  logoUrl: '/mw-logo.png',
  defaultRentalDuration: 1,
  defaultSecurityDeposit: 1000,
  minRentalDuration: 1,
  maxRentalDuration: 30,
};
