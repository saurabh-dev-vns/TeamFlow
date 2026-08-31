import React, { useState } from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';

const AddMemberModal = ({ open, onClose, onAdd, allUsers = [], existingMemberIds = [] }) => {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const available = allUsers.filter((u) => !existingMemberIds.includes(u._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      await onAdd(selected);
      setSelected('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Team Member" size="sm">
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Select a user</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Choose a user...</option>
            {available.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {available.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">All existing users are already members of this project.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selected}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
