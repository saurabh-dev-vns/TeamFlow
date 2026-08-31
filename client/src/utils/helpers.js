export const formatDate = (date) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'Completed') return false;
  return new Date(dueDate) < new Date();
};

export const priorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-700';
    case 'Medium':
      return 'bg-amber-100 text-amber-700';
    case 'Low':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const statusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700';
    case 'Todo':
      return 'bg-gray-100 text-gray-700';
    case 'Planning':
      return 'bg-purple-100 text-purple-700';
    case 'On Hold':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
