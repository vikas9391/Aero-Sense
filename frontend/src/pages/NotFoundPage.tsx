import React from 'react';
import { Link } from 'react-router-dom';
import { PlaneTakeoff } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <PlaneTakeoff className="h-10 w-10 text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
};
