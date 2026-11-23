import { StorageService } from './storage';
import { Customer, CustomerFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';

const storage = new StorageService<Customer>(STORAGE_KEYS.CUSTOMERS);

export const customerService = {
  async getAll(): Promise<Customer[]> {
    return storage.getAll();
  },

  async getActive(): Promise<Customer[]> {
    return storage.query((c) => !c.isArchived);
  },

  async getById(id: string): Promise<Customer | undefined> {
    return storage.getById(id);
  },

  async create(data: CustomerFormData): Promise<Customer> {
    const customId = data.id?.trim();
    if (customId) {
      const existing = await storage.getById(customId);
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
    return storage.create(customer);
  },

  async update(id: string, data: Partial<CustomerFormData>): Promise<Customer | undefined> {
    const { id: _ignoredId, ...updates } = data;
    return storage.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async archive(id: string): Promise<Customer | undefined> {
    return storage.update(id, { isArchived: true, updatedAt: new Date().toISOString() } as Partial<Customer>);
  },

  async restore(id: string): Promise<Customer | undefined> {
    return storage.update(id, { isArchived: false, updatedAt: new Date().toISOString() } as Partial<Customer>);
  },

  async delete(id: string): Promise<boolean> {
    return storage.delete(id);
  },

  async search(query: string): Promise<Customer[]> {
    const q = query.toLowerCase();
    return storage.query(
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
