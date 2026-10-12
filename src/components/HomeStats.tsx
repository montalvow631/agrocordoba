import React, { useEffect, useState } from 'react';
import { CircleDollarSign, MapPinned, Sprout } from 'lucide-react';
import { MUNICIPALITIES } from '../data/mockData';

const ALLIED_FARMERS = 180;
const COUNT_DURATION_MS = 750;

const useCountUp = (target: number) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setCount(target);
      return;
    }

    let frame = 0;
    let startTime = 0;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / COUNT_DURATION_MS, 1);
      setCount(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return count;
};

export const HomeStats: React.FC = () => {
  const farmerCount = useCountUp(ALLIED_FARMERS);
  const stats = [
    {
      icon: Sprout,
      value: `+${new Intl.NumberFormat('es-CO').format(farmerCount)}`,
      label: 'campesinos aliados',
      accessibleValue: '+180 campesinos aliados',
    },
    {
      icon: MapPinned,
      value: String(MUNICIPALITIES.length),
      label: 'municipios de Córdoba',
      accessibleValue: `${MUNICIPALITIES.length} municipios de Córdoba`,
    },
    {
      icon: CircleDollarSign,
      value: 'COP',
      label: 'precios en pesos colombianos',
      accessibleValue: 'Precios en pesos colombianos',
    },
  ];

  return (
    <section aria-label="AgroCórdoba en cifras" className="border-b border-[#d9d5c5] bg-[#f1efdf]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 divide-y divide-[#ded9cb] px-6 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-10 sm:py-0">
        {stats.map(({ icon: Icon, value, label, accessibleValue }, index) => (
          <div
            key={label}
            aria-label={accessibleValue}
            className={`flex items-center gap-4 py-5 sm:justify-center sm:py-7 ${index === 0 ? 'sm:justify-start' : ''}`}
          >
            <Icon className="h-5 w-5 shrink-0 text-[#a7782c]" aria-hidden="true" />
            <div>
              <p className="font-serif text-2xl font-semibold leading-none tracking-tight text-[#203a2b] sm:text-[1.7rem]">
                {value}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7065] sm:text-[11px]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
