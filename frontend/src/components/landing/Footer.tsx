import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-white/10 bg-ink px-6 py-12 text-white md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">AERO-SENSE</div>
          <p className="mt-2 max-w-sm font-body text-sm text-white/50">
            A secure digital identity and traceability layer for aviation components.
          </p>
        </div>
        <button onClick={() => navigate('/login')} className="pill-btn pill-btn-on-dark">
          Access Platform
        </button>
      </div>
      <div className="mx-auto mt-10 max-w-[1400px] border-t border-white/10 pt-6 font-body text-xs text-white/35">
        © {new Date().getFullYear()} AERO-SENSE. All rights reserved.
      </div>
    </footer>
  );
};
