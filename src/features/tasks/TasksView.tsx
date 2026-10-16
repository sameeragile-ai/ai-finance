import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { taskService, TaskFilter } from '../../services/taskService';
import { clientService } from '../../services/clientService';
import { storage } from '../../services/storage';
import { TaskItem, TaskPriority, TaskCategory, Client, User as UserType } from '../../types';
import { formatDateAU, PRIORITY_CONFIG } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Overlays';
import { Input, Select, Textarea } from '../../components/ui/Input';

export const TasksView: React.FC = () => {
  const { role, currentUser, canDelete } = useAuth();
  const { success, error } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Quick Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<TaskPriority>('High');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Lender Follow-up');
  const [newClientId, setNewClientId] = useState<string>('');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const brokerFilter = role === 'broker' ? currentUser?.id : undefined;
      const [tsks, cls] = await Promise.all([
        taskService.getAll({
          assignedToId: brokerFilter,
          filter: activeFilter,
          search: searchQuery,
        }),
        clientService.getAll(),
      ]);
      setTasks(tsks);
      setClients(cls);
      const allUsers = storage.getUsers();
      setUsers(allUsers);
      if (!newAssigneeId && allUsers.length > 0) {
        setNewAssigneeId(currentUser?.id || allUsers[0].id);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [role, currentUser, activeFilter, searchQuery]);

  const handleToggleComplete = async (taskId: string) => {
    try {
      const updated = await taskService.toggleComplete(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t)).filter((t) => {
          if (activeFilter === 'Completed') return t.status === 'Completed';
          if (activeFilter === 'All') return true;
          return t.status === 'Pending';
        })
      );
      success(
        updated.status === 'Completed' ? 'Task Completed' : 'Task Reopened',
        updated.title
      );
    } catch (err) {
      error('Failed to update task');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const assignedUser = users.find((u) => u.id === newAssigneeId) || users[0];
      const linkedClient = clients.find((c) => c.id === newClientId);

      await taskService.create({
        title: newTitle,
        description: newDesc,
        dueDate: newDueDate,
        priority: newPriority,
        status: 'Pending',
        category: newCategory,
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
        linkedClientId: linkedClient?.id,
        linkedClientName: linkedClient ? `${linkedClient.firstName} ${linkedClient.lastName}` : undefined,
      });

      success('Task Created', 'Follow-up task scheduled successfully.');
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      await loadTasks();
    } catch (err) {
      error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    await taskService.delete(taskToDelete.id);
    success('Task Deleted', 'Follow up removed.');
    setTaskToDelete(null);
    await loadTasks();
  };

  // Filtered by priority
  const displayedTasks = useMemo(() => {
    if (priorityFilter === 'ALL') return tasks;
    return tasks.filter((t) => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  const filterTabs: TaskFilter[] = ['Today', 'Overdue', 'Upcoming', 'Completed', 'All'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tasks & Follow-ups</h1>
            <Badge variant="teal" size="sm">
              {displayedTasks.length} {activeFilter}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track bank conditions, valuation bookings, credit disclosures, and settlement coordination.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Quick Add Task
        </Button>
      </div>

      {/* Tabs and Filter Bar */}
      <Card padded className="py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {filterTabs.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List with Framer Motion AnimatePresence */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : displayedTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title={`No ${activeFilter.toLowerCase()} tasks found`}
          description="Everything is up to date! Create a new follow-up task or switch filter."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              Schedule New Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {displayedTasks.map((task) => {
              const isDone = task.status === 'Completed';
              const pConfig = PRIORITY_CONFIG[task.priority];

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className={`p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-start gap-3.5 group ${
                    isDone ? 'bg-slate-50/70 border-slate-200' : ''
                  }`}
                >
                  {/* Checkbox with custom style */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-teal-600 bg-white'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4
                        className={`text-sm font-bold text-slate-900 ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${pConfig.badgeClass}`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {task.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {formatDateAU(task.dueDate)}
                      </span>
                      {task.linkedClientName && (
                        <span className="text-teal-700 font-semibold">
                          Client: {task.linkedClientName}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <User className="w-3 h-3 text-slate-400" />
                        {task.assignedToName}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete Task"
                      onClick={() => setTaskToDelete(task)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Follow-up Task"
        description="Assign a credit compliance task or client communication."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Task Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Verify 90-day salary credits on bank statement"
            required
          />

          <Textarea
            label="Description & Instructions"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Additional notes for broker or processing assistant..."
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
            />
            <Select
              label="Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
            >
              <option value="Document Collection">Document Collection</option>
              <option value="Lender Follow-up">Lender Follow-up</option>
              <option value="Client Review">Client Review</option>
              <option value="Compliance">Compliance (BID / NCCP)</option>
              <option value="Settlement">Settlement & PEXA</option>
            </Select>

            <Select
              label="Assignee"
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Linked Client (optional)"
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
          >
            <option value="">No linked client (General task)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.address.suburb})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
};
