import React from 'react';

interface AgroCordobaBrandProps {
  theme?: 'light' | 'dark';
  subtitle?: string;
  compact?: boolean;
}

export const AgroCordobaBrand: React.FC<AgroCordobaBrandProps> = ({
  theme = 'light',
  subtitle = 'Del campo a tu mesa',
  compact = false,
}) => {
  const dark = theme === 'dark';

  return (
    <span className="inline-flex items-center gap-3 text-left">
      <img
        src="/images/agrocordoba-icon.png"
        alt=""
        aria-hidden="true"
        className={`h-auto shrink-0 ${compact ? 'w-9' : 'w-11'}`}
      />
      <span className="min-w-0">
        <span className={`block whitespace-nowrap font-display font-bold leading-none tracking-tight ${compact ? 'text-lg' : 'text-xl'} ${dark ? 'text-white' : 'text-[#1f4d36]'}`}>
          Agro<span className={dark ? 'text-[#f2c36b]' : 'text-[#c5542d]'}>Córdoba</span>
        </span>
        {subtitle && (
          <span className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/75' : 'text-[#66746a]'}`}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
};

export default AgroCordobaBrand;
