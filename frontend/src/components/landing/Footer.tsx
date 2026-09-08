import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AeroLogo } from '../Logo';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-pebble bg-[var(--bg-app)] px-6 py-12 text-ink md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <AeroLogo size="sm" />
          <p className="mt-3 max-w-sm font-body text-sm text-ash">
            A secure digital identity and traceability layer for aviation components.
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ash">Track · Verify · Protect</p>
        </div>
        <button onClick={() => navigate('/login')} className="pill-btn pill-btn-primary">
          Access Platform
        </button>
      </div>
      <div className="mx-auto mt-10 max-w-[1400px] border-t border-pebble pt-6 font-body text-xs text-ash">
        © {new Date().getFullYear()} AERO-SENSE. All rights reserved.
      </div>
    </footer>
  );
};
