import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
    <div className="h-3 w-1/3 bg-gray-200 rounded mb-6" />
    <div className="h-8 w-1/4 bg-gray-200 rounded" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 animate-pulse">
    <div className="h-9 w-9 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/3 bg-gray-200 rounded" />
      <div className="h-2.5 w-1/4 bg-gray-200 rounded" />
    </div>
  </div>
);
