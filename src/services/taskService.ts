import { TaskItem, TaskPriority } from '../types';
import { simulateDelay, storage } from './storage';

export type TaskFilter = 'All' | 'Today' | 'Overdue' | 'Upcoming' | 'Completed';

export const taskService = {
  async getAll(options: { assignedToId?: string; filter?: TaskFilter; search?: string } = {}): Promise<TaskItem[]> {
    await simulateDelay(140);
    let list = storage.getTasks();

    if (options.assignedToId) {
      list = list.filter((t) => t.assignedToId === options.assignedToId);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (options.filter) {
      switch (options.filter) {
        case 'Today':
          list = list.filter((t) => t.status === 'Pending' && t.dueDate === todayStr);
          break;
        case 'Overdue':
          list = list.filter((t) => t.status === 'Pending' && t.dueDate < todayStr);
          break;
        case 'Upcoming':
          list = list.filter((t) => t.status === 'Pending' && t.dueDate > todayStr);
          break;
        case 'Completed':
          list = list.filter((t) => t.status === 'Completed');
          break;
        case 'All':
        default:
          break;
      }
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.linkedClientName && t.linkedClientName.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async create(taskData: Omit<TaskItem, 'id' | 'createdAt' | 'completedAt'>): Promise<TaskItem> {
    await simulateDelay(180);
    const tasks = storage.getTasks();
    const newTask: TaskItem = {
      ...taskData,
      id: `tsk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    storage.setTasks(tasks);
    return newTask;
  },

  async toggleComplete(id: string): Promise<TaskItem> {
    await simulateDelay(120);
    const tasks = storage.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const isNowCompleted = task.status !== 'Completed';
    task.status = isNowCompleted ? 'Completed' : 'Pending';
    task.completedAt = isNowCompleted ? new Date().toISOString() : undefined;

    storage.setTasks(tasks);
    return task;
  },

  async update(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    await simulateDelay(150);
    const tasks = storage.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const updated = { ...tasks[index], ...updates };
    tasks[index] = updated;
    storage.setTasks(tasks);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await simulateDelay(120);
    const tasks = storage.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    storage.setTasks(filtered);
    return true;
  },
};
