import React from 'react';
import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

const NotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center text-center px-4">
    <CompassIcon size={40} className="text-gray-300 mb-4" />
    <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
    <p className="text-sm text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
    <Link to="/dashboard" className="mt-5 text-sm font-medium text-primary-600 hover:underline">
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
