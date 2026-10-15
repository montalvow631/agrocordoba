import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Leaf, MapPin, Pause, Play, UsersRound } from 'lucide-react';

interface HeroProps {
  onExploreCatalog: () => void;
  onExploreMap: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const HERO_FIELDS = [
  { src: '/images/portada-campo-atardecer.png', label: 'Cultivo al atardecer' },
  { src: '/images/portada-productor.png', label: 'Productor trabajando en el campo' },
  { src: '/images/field-maize.webp', label: 'Cultivo de maíz al atardecer' },
];

export const Hero: React.FC<HeroProps> = ({
  onExploreCatalog,
  onExploreMap,
  onOpenAuth,
}) => (
  <HeroContent
    onExploreCatalog={onExploreCatalog}
    onExploreMap={onExploreMap}
    onOpenAuth={onOpenAuth}
  />
);

const HeroContent: React.FC<HeroProps> = ({
  onExploreCatalog,
  onExploreMap,
  onOpenAuth,
}) => {
  const [activeField, setActiveField] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveField((current) => (current + 1) % HERO_FIELDS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
  <section
    id="hero"
    className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#07503f] px-6 pb-20 pt-32 text-white sm:min-h-[100svh] sm:px-10"
  >
    {HERO_FIELDS.map((field, index) => (
      <img
        key={field.src}
        src={field.src}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 -z-20 h-full w-full object-cover object-center transition-opacity duration-700 ${index === activeField ? 'hero-field-drift opacity-100' : 'opacity-0'}`}
        fetchPriority={index === 0 ? 'high' : 'low'}
      />
    ))}
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,36,28,0.56)_0%,rgba(5,48,37,0.38)_50%,rgba(5,36,28,0.48)_100%)]" />
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,31,24,0.65)_0%,rgba(5,31,24,0.06)_48%,rgba(5,31,24,0.4)_100%)]" />

    <div className="mx-auto w-full max-w-[980px] text-center">
      <button
        type="button"
        onClick={onExploreMap}
        className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/45 bg-[#07503f]/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8fe85] backdrop-blur-sm transition hover:bg-[#07503f]/75"
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Córdoba · Caribe colombiano
      </button>

      <h1 className="mx-auto max-w-[900px] font-editorial text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-white sm:text-7xl lg:text-[5.6rem]">
        Del campo de Córdoba a tu mesa,
        <span className="mt-2 block font-editorial italic text-[#e8fe85]">
          sin intermediarios.
        </span>
      </h1>

      <p className="mx-auto mt-7 max-w-[690px] text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
        Conectamos a productores campesinos de Córdoba con hogares,
        restaurantes y negocios que buscan alimentos de la región. Explora las
        cosechas y acuerda directamente con quien las cultiva.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onExploreCatalog}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#e8fe85] px-7 text-sm font-semibold tracking-[0.025em] text-[#07503f] shadow-lg shadow-black/20 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Leaf className="h-4 w-4" aria-hidden="true" />
          Explorar cosechas
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onOpenAuth('register')}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/65 bg-white/10 px-7 text-sm font-medium tracking-[0.025em] text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          Crear cuenta gratis
        </button>
      </div>

      <div className="mx-auto mt-12 flex max-w-[760px] flex-wrap justify-center gap-x-8 gap-y-4 border-t border-white/30 pt-6 text-sm text-white/90 sm:mt-14">
        <div className="flex items-center gap-2.5">
          <Leaf className="h-4 w-4 text-[#e8fe85]" aria-hidden="true" />
          <span>Productos de la región</span>
        </div>
        <div className="flex items-center gap-2.5">
          <UsersRound className="h-4 w-4 text-[#e8fe85]" aria-hidden="true" />
          <span>Trato directo con productores</span>
        </div>
        <button
          type="button"
          onClick={onExploreMap}
          className="flex items-center gap-2.5 transition hover:text-white"
        >
          <MapPin className="h-4 w-4 text-[#e8fe85]" aria-hidden="true" />
          <span>Conoce nuestras regiones</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      onClick={onExploreCatalog}
      className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/85 transition hover:text-white"
      aria-label="Desliza para ver las cosechas"
    >
      Desliza
      <ArrowDown className="h-4 w-4" aria-hidden="true" />
    </button>
    <div className="absolute bottom-8 right-6 flex items-center gap-2 sm:right-10" role="group" aria-label="Paisajes de la portada" onFocusCapture={() => setIsPaused(true)}>
      {HERO_FIELDS.map((field, index) => (
        <button
          key={field.src}
          type="button"
          onClick={() => setActiveField(index)}
          aria-label={`Mostrar imagen ${index + 1}: ${field.label}`}
          aria-pressed={index === activeField}
          className={`h-2.5 rounded-full border border-white/80 transition-all ${index === activeField ? 'w-7 bg-[#e8fe85]' : 'w-2.5 bg-white/45 hover:bg-white/80'}`}
        />
      ))}
      <button
        type="button"
        onClick={() => setIsPaused((paused) => !paused)}
        aria-label={isPaused ? 'Reanudar cambio de fotografías' : 'Pausar cambio de fotografías'}
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/55 bg-[#07503f]/45 text-white transition hover:bg-[#07503f]/75"
      >
        {isPaused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </div>
  </section>
  );
};
