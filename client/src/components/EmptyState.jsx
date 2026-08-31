import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={26} className="text-gray-400" />
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
