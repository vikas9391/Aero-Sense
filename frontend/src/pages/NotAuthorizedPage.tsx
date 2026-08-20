import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const NotAuthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <ShieldAlert className="h-10 w-10 text-amber-400 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">You don't have access to this page</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Your account role doesn't include permission to view this section. Contact your company
        admin if you believe this is a mistake.
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
