import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: user.name, avatar: user.avatar || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={form.name} src={form.avatar} size="lg" />
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Avatar URL</label>
            <input
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              disabled
              value={user.email}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Joined</label>
            <input
              disabled
              value={formatDate(user.createdAt)}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
