import { StorageService } from './storage';
import { Vehicle, VehicleFormData } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/utils';

const storage = new StorageService<Vehicle>(STORAGE_KEYS.VEHICLES);

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    return storage.getAll();
  },

  async getAvailable(): Promise<Vehicle[]> {
    return storage.query((v) => v.status === 'available');
  },

  async getById(id: string): Promise<Vehicle | undefined> {
    return storage.getById(id);
  },

  async create(data: VehicleFormData): Promise<Vehicle> {
    const vehicle: Vehicle = {
      id: generateId('VH'),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return storage.create(vehicle);
  },

  async update(id: string, data: Partial<VehicleFormData>): Promise<Vehicle | undefined> {
    return storage.update(id, { ...data, updatedAt: new Date().toISOString() });
  },

  async updateStatus(id: string, status: Vehicle['status']): Promise<Vehicle | undefined> {
    return storage.update(id, { status, updatedAt: new Date().toISOString() } as Partial<Vehicle>);
  },

  async delete(id: string): Promise<boolean> {
    return storage.delete(id);
  },

  async search(query: string): Promise<Vehicle[]> {
    const q = query.toLowerCase();
    return storage.query(
      (v) =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q),
    );
  },
};
