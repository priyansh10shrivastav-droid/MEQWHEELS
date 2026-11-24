import { StorageService } from './storage';
import { Booking, BookingFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId, calculateDuration, isDateOverlap } from '../lib/utils';
import { customerService } from './customerService';
import { vehicleService } from './vehicleService';
import { paymentService } from './paymentService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const storage = new StorageService<Booking>(STORAGE_KEYS.BOOKINGS);

export const bookingService = {
  async getAll(): Promise<Booking[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, customers(custom_id, name, phone), vehicles(custom_id, brand, model, registration_number)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Booking[] = data.map((b: any) => ({
            id: b.custom_id,
            customerId: b.customers?.custom_id || b.customer_id,
            customerName: b.customers?.name || '',
            customerPhone: b.customers?.phone || '',
            vehicleId: b.vehicles?.custom_id || b.vehicle_id,
            vehicleName: b.vehicles ? `${b.vehicles.brand} ${b.vehicles.model}` : '',
            vehicleRegistration: b.vehicles?.registration_number,
            pickupDate: b.pickup_date,
            pickupTime: b.pickup_time || '10:00:00',
            returnDate: b.return_date,
            returnTime: b.return_time || '10:00:00',
            rentalDuration: Number(b.rental_duration),
            rentalAmount: Number(b.rental_amount),
            securityDeposit: Number(b.security_deposit || 0),
            advancePayment: Number(b.advance_payment || 0),
            remainingBalance: Number(b.outstanding_balance ?? Math.max(0, b.rental_amount - b.advance_payment)),
            status: b.status,
            notes: b.notes || undefined,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          }));
          storage.save(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase bookings fetch notice:', err);
      }
    }
    return storage.getAll();
  },

  async getById(id: string): Promise<Booking | undefined> {
    return storage.getById(id);
  },

  async getByCustomer(customerId: string): Promise<Booking[]> {
    return storage.query((b) => b.customerId === customerId);
  },

  async getByVehicle(vehicleId: string): Promise<Booking[]> {
    return storage.query(
      (b) => b.vehicleId === vehicleId || Boolean(b.vehicles?.some((v) => v.vehicleId === vehicleId)),
    );
  },

  async getActive(): Promise<Booking[]> {
    return storage.query((b) => b.status === 'active');
  },

  async getUpcomingReturns(): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    return storage.query(
      (b) => (b.status === 'active' || b.status === 'confirmed') && b.returnDate >= today && b.returnDate <= new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    );
  },

  async checkOverlap(vehicleId: string, pickupDate: string, returnDate: string, excludeBookingId?: string): Promise<boolean> {
    const bookings = await storage.query(
      (b) =>
        (b.vehicleId === vehicleId || Boolean(b.vehicles?.some((v) => v.vehicleId === vehicleId))) &&
        b.id !== excludeBookingId &&
        (b.status === 'confirmed' || b.status === 'active'),
    );
    return bookings.some((b) => isDateOverlap(pickupDate, returnDate, b.pickupDate, b.returnDate));
  },

  async create(data: BookingFormData): Promise<Booking> {
    const customer = await customerService.getById(data.customerId);

    // Support multiple vehicles or single vehicle fallback
    const vehicleItems = (data.vehicles && data.vehicles.length > 0)
      ? data.vehicles
      : (data.vehicleId ? [{ vehicleId: data.vehicleId, vehicleName: '', odometerReading: data.odometerReading }] : []);

    if (vehicleItems.length === 0) {
      throw new Error('Please select at least one vehicle.');
    }

    // Check availability and overlap for all selected vehicles
    for (const vItem of vehicleItems) {
      const v = await vehicleService.getById(vItem.vehicleId);
      if (v && (v.status === 'maintenance' || v.status === 'inactive')) {
        throw new Error(`Vehicle ${v.brand} ${v.model} (${v.registrationNumber}) is in ${v.status} and cannot be booked.`);
      }

      const hasOverlap = await this.checkOverlap(vItem.vehicleId, data.pickupDate, data.returnDate);
      if (hasOverlap) {
        throw new Error(`Vehicle ${v ? `${v.brand} ${v.model}` : vItem.vehicleId} already has an active or confirmed booking for these dates.`);
      }
    }

    const duration = calculateDuration(data.pickupDate, data.returnDate);
    const remainingBalance = Math.max(0, data.rentalAmount - data.advancePayment);
    const initialStatus = data.status || 'confirmed';

    const images = data.images || [
      ...(data.drivingLicensePhoto ? [data.drivingLicensePhoto] : []),
      ...(data.rentalAgreementPhoto ? [data.rentalAgreementPhoto] : []),
    ];

    const primaryVehicleId = vehicleItems[0]?.vehicleId || data.vehicleId || '';
    const combinedVehicleName = vehicleItems.map((v) => v.vehicleName).filter(Boolean).join(', ') || primaryVehicleId;

    const customId = data.id?.trim();
    if (customId) {
      const existing = await storage.getById(customId);
      if (existing) {
        throw new Error(`Booking ID "${customId}" already exists. Please enter a unique ID or leave blank to auto-generate.`);
      }
    }

    const booking: Booking = {
      id: customId || generateId('BK'),
      customerId: data.customerId,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      vehicleId: primaryVehicleId,
      vehicleName: combinedVehicleName,
      vehicles: vehicleItems,
      odometerReading: vehicleItems[0]?.odometerReading ?? data.odometerReading ?? 0,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      returnDate: data.returnDate,
      returnTime: data.returnTime,
      rentalDuration: duration,
      rentalAmount: data.rentalAmount,
      securityDeposit: data.securityDeposit,
      advancePayment: data.advancePayment,
      remainingBalance,
      status: initialStatus,
      notes: data.notes,
      images,
      drivingLicensePhoto: data.drivingLicensePhoto || images[0],
      rentalAgreementPhoto: data.rentalAgreementPhoto || images[1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await storage.create(booking);

    // Save to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data: dbCustomer } = await supabase.from('customers').select('id').eq('custom_id', booking.customerId).single();
        const { data: dbVehicle } = await supabase.from('vehicles').select('id').eq('custom_id', booking.vehicleId).single();

        if (dbCustomer && dbVehicle) {
          await supabase.from('bookings').insert({
            custom_id: booking.id,
            customer_id: dbCustomer.id,
            vehicle_id: dbVehicle.id,
            pickup_date: booking.pickupDate,
            pickup_time: booking.pickupTime || '10:00:00',
            return_date: booking.returnDate,
            return_time: booking.returnTime || '10:00:00',
            rental_duration: booking.rentalDuration,
            rental_amount: booking.rentalAmount,
            security_deposit: booking.securityDeposit,
            advance_payment: booking.advancePayment,
            amount_paid: booking.advancePayment,
            outstanding_balance: booking.remainingBalance,
            status: booking.status,
            notes: booking.notes || null,
            created_at: booking.createdAt,
            updated_at: booking.updatedAt,
          });
        }
      } catch (err) {
        console.warn('Supabase booking insert notice:', err);
      }
    }

    // Update vehicle status for all booked vehicles
    for (const vItem of vehicleItems) {
      if (initialStatus === 'active') {
        await vehicleService.updateStatus(vItem.vehicleId, 'rented');
      } else if (initialStatus === 'confirmed') {
        const v = await vehicleService.getById(vItem.vehicleId);
        if (v?.status === 'available') {
          await vehicleService.updateStatus(vItem.vehicleId, 'reserved');
        }
      }
    }

    // Auto-record advance payment if provided
    if (data.advancePayment > 0) {
      await paymentService.create({
        customerId: data.customerId,
        bookingId: saved.id,
        amount: data.advancePayment,
        paymentMethod: 'upi',
        transactionReference: `ADV-${saved.id}`,
        paymentDate: data.pickupDate || new Date().toISOString().split('T')[0],
        paymentType: 'advance',
        notes: `Advance payment for booking ${saved.id}`,
      });
    }

    return saved;
  },

  async update(id: string, data: Partial<BookingFormData>): Promise<Booking | undefined> {
    const existing = await storage.getById(id);
    if (!existing) return undefined;

    const pickupDate = data.pickupDate || existing.pickupDate;
    const returnDate = data.returnDate || existing.returnDate;

    const vehicleItems = data.vehicles || existing.vehicles || (
      existing.vehicleId ? [{ vehicleId: existing.vehicleId, vehicleName: existing.vehicleName, odometerReading: existing.odometerReading }] : []
    );

    // Check overlap if dates or vehicles changed
    if (data.vehicles !== undefined || data.vehicleId !== undefined || data.pickupDate !== undefined || data.returnDate !== undefined) {
      for (const vItem of vehicleItems) {
        const hasOverlap = await this.checkOverlap(vItem.vehicleId, pickupDate, returnDate, id);
        if (hasOverlap) {
          throw new Error(`Vehicle ${vItem.vehicleName || vItem.vehicleId} already has an active or confirmed booking for these dates.`);
        }
      }
    }

    const rentalAmount = data.rentalAmount ?? existing.rentalAmount;
    const advancePayment = data.advancePayment ?? existing.advancePayment;
    const duration = calculateDuration(pickupDate, returnDate);
    const remainingBalance = Math.max(0, rentalAmount - advancePayment);
    const newStatus = data.status || existing.status;

    const customer = data.customerId ? await customerService.getById(data.customerId) : undefined;
    const primaryVehicleId = vehicleItems[0]?.vehicleId || data.vehicleId || existing.vehicleId;
    const combinedVehicleName = vehicleItems.map((v) => v.vehicleName).filter(Boolean).join(', ') || existing.vehicleName;

    const updated = await storage.update(id, {
      ...data,
      customerName: customer ? customer.name : existing.customerName,
      customerPhone: customer ? customer.phone : existing.customerPhone,
      vehicleId: primaryVehicleId,
      vehicleName: combinedVehicleName,
      vehicles: vehicleItems,
      rentalDuration: duration,
      rentalAmount,
      advancePayment,
      remainingBalance,
      status: newStatus,
      images: data.images !== undefined ? data.images : existing.images,
      updatedAt: new Date().toISOString(),
    } as Partial<Booking>);

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (newStatus !== undefined) payload.status = newStatus;
        if (data.rentalAmount !== undefined) payload.rental_amount = data.rentalAmount;
        if (data.advancePayment !== undefined) payload.advance_payment = data.advancePayment;
        if (remainingBalance !== undefined) payload.outstanding_balance = remainingBalance;
        if (data.notes !== undefined) payload.notes = data.notes;
        await supabase.from('bookings').update(payload).eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase booking update notice:', err);
      }
    }

    // Handle vehicle status transitions for all vehicles
    if (newStatus === 'active') {
      for (const vItem of vehicleItems) {
        await vehicleService.updateStatus(vItem.vehicleId, 'rented');
      }
    } else if (newStatus === 'completed' || newStatus === 'cancelled') {
      for (const vItem of vehicleItems) {
        const otherActive = await storage.query(
          (b) =>
            (b.vehicleId === vItem.vehicleId || Boolean(b.vehicles?.some((v) => v.vehicleId === vItem.vehicleId))) &&
            b.id !== id &&
            (b.status === 'active' || b.status === 'confirmed'),
        );
        if (otherActive.length === 0) {
          await vehicleService.updateStatus(vItem.vehicleId, 'available');
        }
      }
    }

    return updated;
  },

  async cancel(id: string): Promise<Booking | undefined> {
    const existing = await storage.getById(id);
    if (!existing) return undefined;

    const updated = await storage.update(id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    } as Partial<Booking>);

    // Free all vehicles if no other active booking
    const vehicleItems = existing.vehicles || (existing.vehicleId ? [{ vehicleId: existing.vehicleId }] : []);
    for (const vItem of vehicleItems) {
      const otherActive = await storage.query(
        (b) =>
          (b.vehicleId === vItem.vehicleId || Boolean(b.vehicles?.some((v) => v.vehicleId === vItem.vehicleId))) &&
          b.id !== id &&
          (b.status === 'active' || b.status === 'confirmed'),
      );
      if (otherActive.length === 0) {
        await vehicleService.updateStatus(vItem.vehicleId, 'available');
      }
    }

    return updated;
  },

  async search(query: string): Promise<Booking[]> {
    const q = query.toLowerCase();
    return storage.query(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.vehicleName.toLowerCase().includes(q),
    );
  },
};
