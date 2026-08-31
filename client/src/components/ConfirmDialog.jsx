import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Delete', loading }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <p className="text-sm text-gray-600 pt-1.5">{description}</p>
    </div>
    <div className="flex justify-end gap-2 mt-6">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition"
      >
        {loading ? 'Deleting...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
