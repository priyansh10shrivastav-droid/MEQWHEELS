import { StorageService } from './storage';
import { Customer, CustomerFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const storage = new StorageService<Customer>(STORAGE_KEYS.CUSTOMERS);

function mapFromDb(c: any): Customer {
  return {
    id: c.custom_id,
    name: c.name,
    phone: c.phone,
    alternatePhone: c.alternate_phone || undefined,
    email: c.email || undefined,
    address: c.address,
    verificationStatus: c.verification_status || 'verified',
    notes: c.notes || '',
    drivingLicensePhoto: c.driving_license_photo || undefined,
    isArchived: Boolean(c.is_archived),
    registrationDate: c.registration_date || c.created_at,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export const customerService = {
  async getAll(): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFromDb);
          storage.save(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase customers fetch notice:', err);
      }
    }
    return storage.getAll();
  },

  async getActive(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => !c.isArchived);
  },

  async getById(id: string): Promise<Customer | undefined> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('custom_id', id)
          .single();

        if (!error && data) {
          return mapFromDb(data);
        }
      } catch (err) {
        console.warn('Supabase customer getById notice:', err);
      }
    }
    return storage.getById(id);
  },

  async create(data: CustomerFormData): Promise<Customer> {
    const customId = data.id?.trim();
    if (customId) {
      const existing = await this.getById(customId);
      if (existing) {
        throw new Error(`Customer ID "${customId}" already exists. Please enter a unique ID.`);
      }
    }
    const customer: Customer = {
      id: customId || generateId('CU'),
      ...data,
      isArchived: false,
      registrationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage cache immediately
    await storage.create(customer);

    // Save to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').insert({
          custom_id: customer.id,
          name: customer.name,
          phone: customer.phone,
          alternate_phone: customer.alternatePhone || null,
          email: customer.email || `${customer.id.toLowerCase()}@meqwheels.local`,
          address: customer.address,
          verification_status: customer.verificationStatus,
          notes: customer.notes || null,
          is_archived: customer.isArchived,
          registration_date: customer.registrationDate,
          created_at: customer.createdAt,
          updated_at: customer.updatedAt,
        });
      } catch (err) {
        console.warn('Supabase customer insert notice:', err);
      }
    }

    return customer;
  },

  async update(id: string, data: Partial<CustomerFormData>): Promise<Customer | undefined> {
    const { id: _ignoredId, ...updates } = data;
    const updatedAt = new Date().toISOString();
    const updated = await storage.update(id, { ...updates, updatedAt });

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: updatedAt };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.alternatePhone !== undefined) payload.alternate_phone = updates.alternatePhone;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.address !== undefined) payload.address = updates.address;
        if (updates.verificationStatus !== undefined) payload.verification_status = updates.verificationStatus;
        if (updates.notes !== undefined) payload.notes = updates.notes;

        await supabase.from('customers').update(payload).eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase customer update notice:', err);
      }
    }

    return updated;
  },

  async archive(id: string): Promise<Customer | undefined> {
    const updated = await storage.update(id, { isArchived: true, updatedAt: new Date().toISOString() } as Partial<Customer>);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase customer archive notice:', err);
      }
    }
    return updated;
  },

  async restore(id: string): Promise<Customer | undefined> {
    const updated = await storage.update(id, { isArchived: false, updatedAt: new Date().toISOString() } as Partial<Customer>);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').update({ is_archived: false, updated_at: new Date().toISOString() }).eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase customer restore notice:', err);
      }
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const res = await storage.delete(id);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').delete().eq('custom_id', id);
      } catch (err) {
        console.warn('Supabase customer delete notice:', err);
      }
    }
    return res;
  },

  async search(query: string): Promise<Customer[]> {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(
      (c) =>
        Boolean(
          c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.alternatePhone && c.alternatePhone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)),
        ),
    );
  },
};
