import { BusinessSettings, defaultSettings } from '../types';
import { STORAGE_KEYS } from '../lib/constants';

export const settingsService = {
  async get(): Promise<BusinessSettings> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  async save(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.get();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  async reset(): Promise<BusinessSettings> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  },
};
