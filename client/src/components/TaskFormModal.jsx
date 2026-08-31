import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { Loader2, Plus, X } from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Todo', 'In Progress', 'Completed'];

const emptyForm = {
  title: '',
  description: '',
  assignedTo: '',
  status: 'Todo',
  priority: 'Medium',
  dueDate: '',
  checklist: [],
};

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const TaskFormModal = ({ open, onClose, onSubmit, members = [], initialData }) => {
  const [form, setForm] = useState(emptyForm);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        assignedTo: initialData.assignedTo?._id || '',
        status: initialData.status || 'Todo',
        priority: initialData.priority || 'Medium',
        dueDate: toInputDate(initialData.dueDate),
        checklist: initialData.checklist || [],
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [initialData, open]);

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setForm({ ...form, checklist: [...form.checklist, { text: newItem.trim(), completed: false }] });
    setNewItem('');
  };

  const removeChecklistItem = (idx) => {
    setForm({ ...form, checklist: form.checklist.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Task' : 'New Task'} size="lg">
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Task title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Design homepage hero section"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Assign to</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Checklist</label>
          <div className="mt-1 space-y-1.5">
            {form.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-sm text-gray-600 flex-1">{item.text}</span>
                <button type="button" onClick={() => removeChecklistItem(idx)} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChecklistItem();
                }
              }}
              placeholder="Add checklist item"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={addChecklistItem}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
