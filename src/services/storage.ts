export class StorageService<T extends { id: string }> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async getAll(): Promise<T[]> {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error(`Failed to read ${this.key} from storage`);
      return [];
    }
  }

  async getById(id: string): Promise<T | undefined> {
    const items = await this.getAll();
    return items.find((item) => item.id === id);
  }

  async create(item: T): Promise<T> {
    const items = await this.getAll();
    items.push(item);
    this.save(items);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const items = await this.getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...updates };
    this.save(items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.save(filtered);
    return true;
  }

  async query(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.getAll();
    return items.filter(predicate);
  }

  save(items: T[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch {
      console.error(`Failed to save ${this.key} to storage`);
    }
  }
}
