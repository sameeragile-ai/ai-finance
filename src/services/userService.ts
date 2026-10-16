import { ActiveSession, Role, User } from '../types';
import { simulateDelay, storage } from './storage';

export const userService = {
  async getAll(): Promise<User[]> {
    await simulateDelay(120);
    return storage.getUsers();
  },

  async getById(id: string): Promise<User | null> {
    await simulateDelay(80);
    const users = storage.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  async invite(userData: {
    name: string;
    email: string;
    role: Role;
    phone: string;
    aclNumber: string;
    title: string;
  }): Promise<User> {
    await simulateDelay(220);
    const users = storage.getUsers();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      ...userData,
      twoFactorEnabled: false,
      active: true,
      lastLogin: 'Never',
    };
    users.push(newUser);
    storage.setUsers(users);
    return newUser;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    await simulateDelay(150);
    const users = storage.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    const updated = { ...users[index], ...updates };
    users[index] = updated;
    storage.setUsers(users);
    return updated;
  },

  async toggleActive(id: string): Promise<User> {
    await simulateDelay(150);
    const users = storage.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index].active = !users[index].active;
    storage.setUsers(users);
    return users[index];
  },

  async getActiveSessions(): Promise<ActiveSession[]> {
    await simulateDelay(120);
    return storage.getSessions();
  },

  async revokeSession(sessionId: string): Promise<boolean> {
    await simulateDelay(150);
    const sessions = storage.getSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    storage.setSessions(filtered);
    return true;
  },
};
