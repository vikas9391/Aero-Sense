import React from 'react';
import { PlaneTakeoff } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <PlaneTakeoff className="h-10 w-10 text-ash mb-4" />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink mb-2">Page not found</h1>
      <p className="text-sm text-ash max-w-sm mb-6">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button to="/dashboard">Back to dashboard</Button>
    </div>
  );
};
