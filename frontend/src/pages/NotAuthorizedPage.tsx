import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotAuthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#f0dcae] bg-[#fbf1de] text-[#b5790f]">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink mb-2">
        You don't have access to this page
      </h1>
      <p className="text-sm text-ash max-w-sm mb-6">
        Your account role doesn't include permission to view this section. Contact your company
        admin if you believe this is a mistake.
      </p>
      <Button to="/dashboard">Back to dashboard</Button>
    </div>
  );
};
