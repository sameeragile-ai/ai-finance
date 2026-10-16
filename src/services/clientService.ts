import { Client } from '../types';
import { simulateDelay, storage } from './storage';

export interface ClientFilterOptions {
  brokerId?: string;
  search?: string;
  state?: string;
  status?: string;
  includeDeleted?: boolean;
}

export const clientService = {
  async getAll(options: ClientFilterOptions = {}): Promise<Client[]> {
    await simulateDelay(150);
    let list = storage.getClients();

    if (!options.includeDeleted) {
      list = list.filter((c) => !c.isDeleted);
    } else {
      list = list.filter((c) => c.isDeleted);
    }

    if (options.brokerId) {
      list = list.filter((c) => c.assignedBrokerId === options.brokerId);
    }

    if (options.state && options.state !== 'ALL') {
      list = list.filter((c) => c.address.state === options.state);
    }

    if (options.status && options.status !== 'ALL') {
      list = list.filter((c) => c.status === options.status);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.address.suburb.toLowerCase().includes(q) ||
          c.address.postcode.includes(q)
      );
    }

    return list;
  },

  async getById(id: string): Promise<Client | null> {
    await simulateDelay(100);
    const clients = storage.getClients();
    return clients.find((c) => c.id === id) || null;
  },

  async create(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<Client> {
    await simulateDelay(200);
    const clients = storage.getClients();
    const newClient: Client = {
      ...clientData,
      id: `cl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
    clients.unshift(newClient);
    storage.setClients(clients);
    return newClient;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    await simulateDelay(180);
    const clients = storage.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Client not found');

    const updated: Client = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    clients[index] = updated;
    storage.setClients(clients);
    return updated;
  },

  async softDelete(id: string): Promise<boolean> {
    await simulateDelay(150);
    const clients = storage.getClients();
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    client.isDeleted = true;
    client.deletedAt = new Date().toISOString();
    storage.setClients(clients);
    return true;
  },

  async restore(id: string): Promise<boolean> {
    await simulateDelay(150);
    const clients = storage.getClients();
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    client.isDeleted = false;
    client.deletedAt = undefined;
    storage.setClients(clients);
    return true;
  },

  async getRecentlyDeleted(): Promise<Client[]> {
    await simulateDelay(120);
    return storage.getClients().filter((c) => c.isDeleted);
  },
};
