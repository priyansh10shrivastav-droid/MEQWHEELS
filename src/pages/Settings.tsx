import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BusinessSettings, defaultSettings } from '../types';
import { settingsService } from '../services/settingsService';
import { seedInitialData } from '../lib/seedData';
import { STORAGE_KEYS } from '../lib/constants';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Building,
  Save,
  RotateCcw,
  Database,
  ShieldAlert,
  Sliders,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

const settingsSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  tagline: z.string().min(2, 'Tagline is required'),
  contactEmail: z.string().email('Please enter a valid email address').or(z.literal('')),
  contactPhone: z.string().min(6, 'Please enter a valid phone number').or(z.literal('')),
  address: z.string().optional(),
  currency: z.string().min(2, 'Currency code is required'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  defaultRentalDuration: z.number().min(1, 'Must be at least 1 day'),
  defaultSecurityDeposit: z.number().min(0, 'Cannot be negative'),
  minRentalDuration: z.number().min(1, 'Must be at least 1 day'),
  maxRentalDuration: z.number().min(1, 'Must be at least 1 day'),
});

type FormValues = z.infer<typeof settingsSchema>;

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    variant?: 'danger' | 'primary';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  useEffect(() => {
    settingsService
      .get()
      .then((data) => reset(data))
      .finally(() => setLoading(false));
  }, [reset]);

  const onFormSubmit = async (data: FormValues) => {
    try {
      await settingsService.save(data);
      toast.success('Business settings saved successfully!');
      reset(data);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleResetToDefaults = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Settings to Default',
      message: 'Are you sure you want to revert all business settings and preferences to default?',
      confirmLabel: 'Reset Settings',
      variant: 'primary',
      onConfirm: async () => {
        const resetData = await settingsService.reset();
        reset(resetData);
        toast.success('Settings restored to defaults');
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReSeedData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Re-seed Demo Data',
      message: 'This will reset your local storage and load fresh demo data (vehicles, customers, bookings, payments). Current edits will be replaced.',
      confirmLabel: 'Re-seed Data',
      variant: 'danger',
      onConfirm: async () => {
        localStorage.clear();
        seedInitialData();
        toast.success('Demo data restored! Refreshing page...');
        setTimeout(() => window.location.reload(), 800);
      },
    });
  };

  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Factory Clear All Records',
      message: 'Are you sure you want to clear all customers, vehicles, bookings, and payments? This will reset the application to a blank state.',
      confirmLabel: 'Clear All Data',
      variant: 'danger',
      onConfirm: async () => {
        localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
        localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
        localStorage.removeItem(STORAGE_KEYS.VEHICLES);
        localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
        toast.success('All records cleared successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 800);
      },
    });
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Configure business details, rental parameters, currency, and local data persistence.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Business Profile */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
            <Building size={18} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Business Profile</h2>
              <p className="text-xs text-neutral-400">Branding, contact points, and physical address.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <img
              src="/mw-logo.png"
              alt="Logo"
              className="h-16 w-16 rounded-full border border-neutral-700 bg-black object-contain p-1"
            />
            <div>
              <p className="text-sm font-semibold text-white">MEQ Wheels Official Logo</p>
              <p className="text-xs text-neutral-400 mt-0.5">Asset: /mw-logo.png (Original unaltered shape)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              placeholder="e.g. MEQ Wheels"
              {...register('businessName')}
              error={errors.businessName?.message}
            />

            <Input
              label="Tagline *"
              placeholder="e.g. Ride Your Way."
              {...register('tagline')}
              error={errors.tagline?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              placeholder="e.g. support@meqwheels.in"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
            />

            <Input
              label="Contact Phone"
              placeholder="e.g. +91 98765 43210"
              {...register('contactPhone')}
              error={errors.contactPhone?.message}
            />
          </div>

          <Textarea
            label="Headquarters / Rental Station Address"
            placeholder="e.g. 100ft Road, Indiranagar, Bengaluru, Karnataka 560038"
            {...register('address')}
            error={errors.address?.message}
          />
        </div>

        {/* Currency & Financial Preferences */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
            <DollarSign size={18} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Currency & Rates</h2>
              <p className="text-xs text-neutral-400">Configure default denomination and symbol.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Currency Code *"
              placeholder="INR"
              {...register('currency')}
              error={errors.currency?.message}
            />

            <Input
              label="Currency Symbol *"
              placeholder="₹"
              {...register('currencySymbol')}
              error={errors.currencySymbol?.message}
            />
          </div>
        </div>

        {/* Rental Duration & Deposit Preferences */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
            <Sliders size={18} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Rental Preferences</h2>
              <p className="text-xs text-neutral-400">Configure default rental days, deposits, and duration constraints.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Default Security Deposit (₹) *"
              type="number"
              placeholder="1000"
              {...register('defaultSecurityDeposit', { valueAsNumber: true })}
              error={errors.defaultSecurityDeposit?.message}
            />

            <Input
              label="Default Rental Duration (Days) *"
              type="number"
              placeholder="1"
              {...register('defaultRentalDuration', { valueAsNumber: true })}
              error={errors.defaultRentalDuration?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Rental Duration (Days) *"
              type="number"
              placeholder="1"
              {...register('minRentalDuration', { valueAsNumber: true })}
              error={errors.minRentalDuration?.message}
            />

            <Input
              label="Maximum Rental Duration (Days) *"
              type="number"
              placeholder="30"
              {...register('maxRentalDuration', { valueAsNumber: true })}
              error={errors.maxRentalDuration?.message}
            />
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>

          <Button
            type="submit"
            icon={<Save size={16} />}
            loading={isSubmitting}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Database & Data Management Section */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <Database size={18} className="text-emerald-400" />
          <div>
            <h2 className="text-base font-semibold text-white">Data Storage & Migration (Stage 1)</h2>
            <p className="text-xs text-neutral-400">
              Operating in client-side persistence mode. Ready for Supabase plug-and-play in Stage 2.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Current Driver:</span> Browser LocalStorage Repository
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Stage 1 Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={handleReSeedData}
          >
            Reload Initial Demo Dataset
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<ShieldAlert size={14} />}
            onClick={handleClearAllData}
          >
            Clear All Stored Records
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default Settings;
