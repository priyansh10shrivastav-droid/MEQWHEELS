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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { migrateLocalStorageToSupabase } from '../lib/migrateData';
import { SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';
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
  Copy,
  ExternalLink,
  Check,
  Cloud,
  RefreshCw,
  AlertCircle,
  Sparkles,
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
  const [dbStatus, setDbStatus] = useState<'checking' | 'ready' | 'missing_tables' | 'error'>('checking');
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const checkDb = async () => {
    setIsCheckingDb(true);
    if (!isSupabaseConfigured) {
      setDbStatus('error');
      setIsCheckingDb(false);
      return;
    }
    try {
      const { error } = await supabase.from('customers').select('id').limit(1);
      if (!error) {
        setDbStatus('ready');
      } else if (error.code === 'PGRST205' || error.message.includes('Could not find the table') || error.message.includes('schema cache')) {
        setDbStatus('missing_tables');
      } else {
        setDbStatus('ready');
      }
    } catch {
      setDbStatus('error');
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    checkDb();
  }, []);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      toast.success('SQL schema copied to clipboard! Paste it into the Supabase SQL editor.');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      toast.error('Could not copy to clipboard. Please copy from supabase/schema.sql');
    }
  };

  const handleSyncToSupabase = async () => {
    setIsMigrating(true);
    toast.loading('Syncing records to Supabase PostgreSQL...', { id: 'db-sync' });
    try {
      const res = await migrateLocalStorageToSupabase();
      if (res.errors.length === 0) {
        toast.success(
          `Synced ${res.customersMigrated} customers, ${res.vehiclesMigrated} vehicles, ${res.bookingsMigrated} bookings, ${res.paymentsMigrated} payments to Supabase!`,
          { id: 'db-sync', duration: 5000 },
        );
      } else {
        toast.success(
          `Synced: ${res.customersMigrated} cust, ${res.vehiclesMigrated} veh, ${res.bookingsMigrated} bk. (${res.errors.length} skipped)`,
          { id: 'db-sync', duration: 5000 },
        );
      }
      checkDb();
    } catch (e: any) {
      toast.error(`Sync error: ${e.message}`, { id: 'db-sync' });
    } finally {
      setIsMigrating(false);
    }
  };
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

      {/* Cloud Database (Supabase) Management Section */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <Cloud size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Supabase Cloud Database & Synchronization</h2>
              <p className="text-xs text-neutral-400">
                Centralized PostgreSQL database for cross-device persistence.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={isCheckingDb ? 'animate-spin' : ''} />}
            onClick={checkDb}
            loading={isCheckingDb}
          >
            Recheck Database
          </Button>
        </div>

        {/* Database Status Alert */}
        {dbStatus === 'ready' ? (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-start gap-3">
            <CheckCircle size={18} className="shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white text-sm">Supabase Database Connected & Tables Ready</p>
              <p className="text-emerald-300/80">
                Your PostgreSQL tables (<code className="text-emerald-200">customers</code>, <code className="text-emerald-200">vehicles</code>, <code className="text-emerald-200">bookings</code>, <code className="text-emerald-200">payments</code>) are active. All new actions automatically sync to the cloud.
              </p>
            </div>
          </div>
        ) : dbStatus === 'missing_tables' ? (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-white text-sm">Action Required: Tables Not Created Yet in Supabase</p>
              <p className="text-amber-300/90 leading-relaxed">
                Your API credentials are connected, but the PostgreSQL database tables have not been created in Supabase yet.
                Click <strong>"Copy SQL Schema"</strong> below and run it in your Supabase SQL Editor to activate full cloud storage.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={copiedSql ? <Check size={14} /> : <Copy size={14} />}
                  onClick={handleCopySql}
                >
                  {copiedSql ? 'Schema Copied!' : 'Copy SQL Schema (1-Click)'}
                </Button>
                <a
                  href="https://supabase.com/dashboard/project/wkpbhrltaaewxrkvvgid/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Open Supabase SQL Editor</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50 text-neutral-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Checking Supabase table status...</span>
            </div>
          </div>
        )}

        {/* Database Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
            <span className="text-neutral-500 block">Supabase Project Host</span>
            <span className="font-mono text-neutral-200 text-[11px] truncate block mt-0.5">
              wkpbhrltaaewxrkvvgid.supabase.co
            </span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
            <span className="text-neutral-500 block">Current Storage Mode</span>
            <span className="font-semibold text-emerald-400 block mt-0.5">
              {dbStatus === 'ready' ? 'Hybrid (Cloud Supabase + Local Cache)' : 'Local Cache (Awaiting SQL Schema Execution)'}
            </span>
          </div>
        </div>

        {/* Cloud Migration Action Bar */}
        <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">Cloud Data Synchronization</p>
            <p className="text-[11px] text-neutral-400">
              Transfer existing local browser records (customers, vehicles, bookings) into Supabase PostgreSQL.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} className="text-emerald-400" />}
            onClick={handleSyncToSupabase}
            loading={isMigrating}
          >
            Sync Local Data to Supabase
          </Button>
        </div>
      </div>

      {/* Local Storage & Reset Section */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <Database size={18} className="text-neutral-400" />
          <div>
            <h2 className="text-base font-semibold text-white">Local Storage Utilities</h2>
            <p className="text-xs text-neutral-400">
              Emergency local dataset resets and demo re-seeding.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
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
