import { StorageService } from './storage';
import { Vehicle, VehicleFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const storage = new StorageService<Vehicle>(STORAGE_KEYS.VEHICLES);

function mapFromDb(v: any): Vehicle {
  return {
    id: v.custom_id,
    registrationNumber: v.registration_number,
    brand: v.brand,
    model: v.model,
    category: v.category,
    rentalPrice: Number(v.rental_price),
    securityDeposit: Number(v.security_deposit),
    status: v.status,
    notes: v.notes || undefined,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  };
}

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFromDb);
          storage.save(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase vehicles fetch notice:', err);
      }
    }
    return storage.getAll();
  },

  async getAvailable(): Promise<Vehicle[]> {
    const all = await this.getAll();
    return all.filter((v) => v.status === 'available');
  },

  async getById(id: string): Promise<Vehicle | undefined> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('custom_id', id)
          .single();

        if (!error && data) {
          return mapFromDb(data);
        }
      } catch (err) {
        console.warn('Supabase vehicle getById notice:', err);
      }
    }
    return storage.getById(id);
  },

  async create(data: VehicleFormData): Promise<Vehicle> {
    const vehicle: Vehicle = {
      id: generateId('VH'),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local cache
    await storage.create(vehicle);

    // Save to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('vehicles').insert({
          custom_id: vehicle.id,
          registration_number: vehicle.registrationNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          category: vehicle.category,
          rental_price: vehicle.rentalPrice,
          security_deposit: vehicle.securityDeposit,
          status: vehicle.status,
          notes: vehicle.notes || null,
          created_at: vehicle.createdAt,
          updated_at: vehicle.updatedAt,
        });
      } catch (err) {
        console.warn('Supabase vehicle insert notice:', err);
      }
    }

    return vehicle;
  },

  async update(id: string, data: Partial<VehicleFormData>): Promise<Vehicle | undefined> {
    const updatedAt = new Date().toISOString();
    const updated = await storage.update(id, { ...data, updatedAt });

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: updatedAt };
        if (data.registrationNumber !== undefined) payload.registration_number = data.registrationNumber;
        if (data.brand !== undefined) payload.brand = data.brand;
        if (data.model !== undefined) payload.model = data.model;
        if (data.category !== undefined) payload.category = data.category;
        if (data.rentalPrice !== undefined) payload.rental_price = data.rentalPrice;
        if (data.securityDeposit !== undefined) payload.security_deposit = data.securityDeposit;
        if (data.status !== undefined) payload.status = data.status;
        if (data.notes !== undefined) payload.notes = data.notes;

        await supabase.from('vehicles').update(payload).eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase vehicle update notice:', err);
      }
    }

    return updated;
  },

  async updateStatus(id: string, status: Vehicle['status']): Promise<Vehicle | undefined> {
    return this.update(id, { status });
  },

  async delete(id: string): Promise<boolean> {
    const res = await storage.delete(id);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('vehicles').delete().eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase vehicle delete notice:', err);
      }
    }
    return res;
  },

  async search(query: string): Promise<Vehicle[]> {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(
      (v) =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q),
    );
  },
};
