import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Wraps a route element and only renders it if the current user's role is
 * in `allow`. Sidebar.tsx already hides these routes' nav links from
 * unauthorized roles, but nothing previously stopped someone from reaching
 * them directly by URL — they'd just hit a raw 403 from the API with a
 * blank or broken-looking page. This makes the client-side behavior match
 * what the nav already implies, with a clear explanation instead of a
 * silent failure.
 *
 * This is a UX guard, not a security boundary — the API's own role checks
 * remain the actual enforcement.
 */
export const RequireRole: React.FC<{ allow: UserRole[]; children: React.ReactNode }> = ({
  allow,
  children,
}) => {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
};
