import { supabase } from './supabase';
import { STORAGE_KEYS } from './constants';
import { Customer, Vehicle, Booking, Payment } from '../types';

export interface MigrationSummary {
  customersMigrated: number;
  vehiclesMigrated: number;
  bookingsMigrated: number;
  paymentsMigrated: number;
  errors: string[];
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    customersMigrated: 0,
    vehiclesMigrated: 0,
    bookingsMigrated: 0,
    paymentsMigrated: 0,
    errors: [],
  };

  try {
    // 1. Get Default Branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('code', 'BLR-IND')
      .single();

    const defaultBranchId = branchData?.id || null;

    // 2. Migrate Customers
    const localCustomers: Customer[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]',
    );

    for (const c of localCustomers) {
      const { error } = await supabase.from('customers').upsert(
        {
          custom_id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          verification_status: c.verificationStatus,
          notes: c.notes || null,
          is_archived: c.isArchived || false,
          registration_date: c.registrationDate || new Date().toISOString(),
          created_at: c.createdAt || new Date().toISOString(),
          updated_at: c.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'custom_id' },
      );

      if (error) {
        summary.errors.push(`Customer ${c.name} (${c.id}): ${error.message}`);
      } else {
        summary.customersMigrated++;
      }
    }

    // 3. Migrate Vehicles
    const localVehicles: Vehicle[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]',
    );

    for (const v of localVehicles) {
      const { error } = await supabase.from('vehicles').upsert(
        {
          custom_id: v.id,
          registration_number: v.registrationNumber,
          brand: v.brand,
          model: v.model,
          category: v.category,
          rental_price: v.rentalPrice,
          security_deposit: v.securityDeposit,
          status: v.status,
          branch_id: defaultBranchId,
          notes: v.notes || null,
          created_at: v.createdAt || new Date().toISOString(),
          updated_at: v.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'custom_id' },
      );

      if (error) {
        summary.errors.push(`Vehicle ${v.brand} ${v.model} (${v.id}): ${error.message}`);
      } else {
        summary.vehiclesMigrated++;
      }
    }

    // Fetch generated UUID mappings for customers and vehicles
    const { data: dbCustomers } = await supabase.from('customers').select('id, custom_id');
    const { data: dbVehicles } = await supabase.from('vehicles').select('id, custom_id');

    const customerMap = new Map((dbCustomers || []).map((c) => [c.custom_id, c.id]));
    const vehicleMap = new Map((dbVehicles || []).map((v) => [v.custom_id, v.id]));

    // 4. Migrate Bookings
    const localBookings: Booking[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]',
    );

    for (const b of localBookings) {
      const customerUuid = customerMap.get(b.customerId);
      const vehicleUuid = vehicleMap.get(b.vehicleId);

      if (!customerUuid || !vehicleUuid) {
        summary.errors.push(
          `Booking ${b.id} skipped: Customer (${b.customerId}) or Vehicle (${b.vehicleId}) not found in Supabase`,
        );
        continue;
      }

      const { error } = await supabase.from('bookings').upsert(
        {
          custom_id: b.id,
          customer_id: customerUuid,
          vehicle_id: vehicleUuid,
          branch_id: defaultBranchId,
          pickup_date: b.pickupDate,
          pickup_time: b.pickupTime || '10:00:00',
          return_date: b.returnDate,
          return_time: b.returnTime || '10:00:00',
          rental_duration: b.rentalDuration || 1,
          rental_amount: b.rentalAmount,
          security_deposit: b.securityDeposit || 0,
          advance_payment: b.advancePayment || 0,
          amount_paid: b.advancePayment || 0,
          outstanding_balance: b.remainingBalance ?? Math.max(0, b.rentalAmount - b.advancePayment),
          status: b.status,
          notes: b.notes || null,
          created_at: b.createdAt || new Date().toISOString(),
          updated_at: b.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'custom_id' },
      );

      if (error) {
        summary.errors.push(`Booking ${b.id}: ${error.message}`);
      } else {
        summary.bookingsMigrated++;
      }
    }

    // Fetch generated UUID mappings for bookings
    const { data: dbBookings } = await supabase.from('bookings').select('id, custom_id');
    const bookingMap = new Map((dbBookings || []).map((b) => [b.custom_id, b.id]));

    // 5. Migrate Payments
    const localPayments: Payment[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]',
    );

    for (const p of localPayments) {
      const customerUuid = customerMap.get(p.customerId);
      const bookingUuid = p.bookingId ? bookingMap.get(p.bookingId) : null;

      if (!customerUuid) {
        summary.errors.push(`Payment ${p.id} skipped: Customer (${p.customerId}) not found`);
        continue;
      }

      const { error } = await supabase.from('payments').upsert(
        {
          custom_id: p.id,
          customer_id: customerUuid,
          booking_id: bookingUuid || null,
          amount: p.amount,
          payment_method: p.paymentMethod,
          transaction_reference: p.transactionReference,
          payment_date: p.paymentDate,
          payment_type: p.paymentType,
          notes: p.notes || null,
          created_at: p.createdAt || new Date().toISOString(),
        },
        { onConflict: 'custom_id' },
      );

      if (error) {
        summary.errors.push(`Payment ${p.id}: ${error.message}`);
      } else {
        summary.paymentsMigrated++;
      }
    }
  } catch (err: any) {
    summary.errors.push(`General migration error: ${err.message}`);
  }

  return summary;
}
