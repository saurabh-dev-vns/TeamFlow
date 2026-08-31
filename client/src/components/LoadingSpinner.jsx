import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 24, className = '', label }) => (
  <div className={`flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`}>
    <Loader2 size={size} className="animate-spin" />
    {label && <span className="text-sm">{label}</span>}
  </div>
);

export default LoadingSpinner;
