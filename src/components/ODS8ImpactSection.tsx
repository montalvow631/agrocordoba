import React from 'react';
import { ArrowRight, BookOpen, Handshake, MapPin, Sprout } from 'lucide-react';

interface ODS8ImpactSectionProps {
  onExploreMunicipality: (municipalityId: string) => void;
}

const stories = [
  {
    municipalityId: 'cienaga-de-oro',
    municipality: 'Ciénaga de Oro',
    theme: 'Cocina y memoria',
    crop: 'Yuca · casabe',
    image: '/images/yuca-real.jpg',
    imageAlt: 'Raíces de yuca, imagen ilustrativa',
    title: 'El casabe también cuenta la historia del territorio',
    description:
      'El Ministerio de Cultura recoge la torta de casabe entre las preparaciones tradicionales que hacen parte de la celebración popular de Semana Santa en Ciénaga de Oro.',
    source: 'Ministerio de Cultura',
    sourceUrl: 'https://mincultura.gov.co/direcciones/patrimonio-y-memoria/Documents/PES-cienaga.pdf',
  },
  {
    municipalityId: 'lorica',
    municipality: 'Lorica',
    theme: 'Trabajo campesino',
    crop: 'Ñame · maíz',
    image: '/images/name-real.jpg',
    imageAlt: 'Ñames cosechados, imagen ilustrativa',
    title: 'Una cosecha que reúne a familias productoras',
    description:
      'En 2024, la Gobernación informó sobre una alianza productiva de ñame que vinculó a 40 familias de Flamenco, Aguas Muertas y Bajo Grande.',
    source: 'Gobernación de Córdoba',
    sourceUrl: 'https://www.cordoba.gov.co/publicaciones/1340/con-entrega-de-insumos-a-campesinos-de-lorica-gobernador-erasmo-zuleta-sigue-reactivando-el-campo-cordobes/',
  },
  {
    municipalityId: 'tierralta',
    municipality: 'Alto Sinú · Tierralta',
    theme: 'Origen y comercialización',
    crop: 'Cacao',
    image: '/images/cacao-real.jpg',
    imageAlt: 'Granos de cacao, imagen ilustrativa',
    title: 'Cacao con raíces en las comunidades del Alto Sinú',
    description:
      'Comunidades Emberá Katío cultivan cacao en el Alto Sinú y participan en procesos que conectan la producción local con organizaciones comercializadoras.',
    source: 'Programa Colombia Sostenible',
    sourceUrl: 'https://www.colombiasostenible.gov.co/programa/2023/03/17/indigenas-embera-katio-producen-cacao-bajo-altos-estandares-ambientales-en-el-sur-de-cordoba/',
  },
];

const priorities = [
  {
    icon: MapPin,
    title: 'Origen a la vista',
    description: 'Cada producto puede mostrar su municipio y cómo contactar a quien lo cultiva.',
  },
  {
    icon: Handshake,
    title: 'Acuerdos directos',
    description: 'Comprador y productor conversan sobre cantidad, precio y entrega.',
  },
  {
    icon: Sprout,
    title: 'Más puertas abiertas',
    description: 'La plataforma busca acercar las cosechas de Córdoba a nuevos compradores.',
  },
];

export const ODS8ImpactSection: React.FC<ODS8ImpactSectionProps> = ({ onExploreMunicipality }) => (
  <section id="impacto" className="border-y border-[#ded9c8] bg-[#f1efdf] py-16 sm:py-20">
    <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#07503f]">
            <span className="h-px w-7 bg-[#07503f]" />
            AgroCórdoba y el ODS 8
          </p>
          <h2 className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.025em] text-[#173b2b] sm:text-5xl">
            Que cada cosecha encuentre su lugar en el mercado.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#4f5d54] sm:text-base">
            El ODS 8 promueve el trabajo decente y el crecimiento económico. AgroCórdoba
            contribuye dando visibilidad a los productos que ya están publicados en el catálogo, su origen y las personas que
            los ofrecen. El precio y las condiciones se acuerdan directamente entre las partes.
          </p>
          <a
            href="#catalogo"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#07503f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#063d31]"
          >
            Descubrir las cosechas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="rounded-[28px] bg-[#07503f] p-6 text-white sm:p-8">
          <div className="mb-6 flex items-center gap-4 border-b border-white/20 pb-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8fe85] font-editorial text-3xl font-semibold text-[#07503f]">8</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e8fe85]">Objetivo de Desarrollo Sostenible</p>
              <h3 className="mt-1 font-editorial text-2xl font-medium leading-tight sm:text-3xl">Trabajo decente y crecimiento económico</h3>
            </div>
          </div>
          <div className="divide-y divide-white/15">
            {priorities.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#e8fe85]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">0{index + 1}</p>
                  <h4 className="mt-0.5 text-sm font-semibold text-white">{title}</h4>
                  <p className="mt-1 text-xs leading-5 text-white/75 sm:text-sm">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-20">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#8a4c12]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Cultura, cosecha y comunidad
            </p>
            <h3 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-[#173b2b] sm:text-4xl">
              Córdoba se cuenta desde sus productos.
            </h3>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#59665e]">
            Historias basadas en fuentes públicas para acercar el origen y el trabajo detrás de cada cultivo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.municipality} className="group overflow-hidden rounded-[20px] border border-[#ded9c8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-52 overflow-hidden bg-[#e6ecd5]">
                <img
                  src={story.image}
                  alt={story.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092b21]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e8fe85]">{story.theme}</p>
                    <h4 className="mt-1 text-lg font-semibold">{story.municipality}</h4>
                  </div>
                  <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[10px] font-semibold backdrop-blur-sm">{story.crop}</span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h5 className="font-editorial text-2xl font-semibold leading-tight text-[#173b2b]">{story.title}</h5>
                <p className="mt-3 text-sm leading-6 text-[#59665e]">{story.description}</p>
                <button
                  type="button"
                  onClick={() => onExploreMunicipality(story.municipalityId)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#07503f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#063d31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07503f]"
                >
                  Ver cosechas de {story.municipality}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#07503f] underline decoration-[#b8c9b7] underline-offset-4 hover:decoration-[#07503f]"
                >
                  Fuente: {story.source}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="mt-3 text-[10px] text-[#8a918b]">Fotografía ilustrativa del producto</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#d9d5c5] bg-white/70 p-4 text-xs leading-5 text-[#59665e] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p><strong className="text-[#173b2b]">Sobre las reseñas:</strong> aún no hay opiniones verificadas de compras en la plataforma. Las mostraremos cuando existan experiencias reales y autorización de sus autores.</p>
        <a href="#como-funciona" className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#07503f] hover:underline">
          Conoce cómo funciona <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  </section>
);
