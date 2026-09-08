import React from 'react';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  dark?: boolean;
};

const sizes = {
  sm: { box: 'h-8 w-8 rounded-[10px]', image: 'h-8 w-8', title: 'text-sm', sub: 'text-[8px]' },
  md: { box: 'h-10 w-10 rounded-xl', image: 'h-10 w-10', title: 'text-base', sub: 'text-[9px]' },
  lg: { box: 'h-14 w-14 rounded-2xl', image: 'h-14 w-14', title: 'text-xl', sub: 'text-[10px]' },
};

export const AeroLogo: React.FC<LogoProps> = ({ size = 'md', showWordmark = true, dark = false }) => {
  const s = sizes[size];

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${s.box} shrink-0 overflow-hidden border border-[#d9def2] bg-white shadow-[0_7px_18px_rgba(36,35,33,.12)]`}>
        <img src="/aero-sense-icon.svg" alt="Aero-Sense" className={`${s.image} object-cover`} />
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <div className={`${s.title} font-display font-black tracking-[0.08em] ${dark ? 'text-white' : 'text-ink'}`}>AERO-SENSE</div>
          <div className={`${s.sub} mt-0.5 font-body font-bold uppercase tracking-[0.18em] ${dark ? 'text-white/60' : 'text-ash'}`}>
            Track · Verify · Protect
          </div>
        </div>
      )}
    </div>
  );
};
