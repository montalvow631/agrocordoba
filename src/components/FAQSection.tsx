import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Leaf,
  MessageCircle,
  Sprout,
} from 'lucide-react';
import { FAQ_ITEMS } from '../data/mockData';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex((current) => (current === idx ? null : idx));
  };

  return (
    <section id="faq" className="border-t border-[#e4dfd2] bg-[#f1efe6] py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e8d9b7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#174b38]">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Guía de AgroCórdoba
          </div>
          <h2 className="mt-5 font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.03em] text-[#173b2b] sm:text-5xl">
            El campo más cerca, con acuerdos claros.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#59645e]">
            Resolvemos las dudas más comunes para que productores y compradores sepan qué ofrece la plataforma y qué deben acordar directamente.
          </p>

          <div className="mt-7 grid max-w-[500px] grid-cols-2 gap-3 sm:gap-4" aria-label="Fotografías del trabajo campesino">
            {[
              { src: '/images/campesinos-colombia.jpg', alt: 'Campesinos trabajando entre cultivos de maíz.', label: 'Cuidado de la cosecha', credit: 'Fotografía ilustrativa' },
              { src: '/images/campesino-colombia.jpg', alt: 'Manos recogiendo café en una finca.', label: 'Recolección de café', credit: 'Fotografía ilustrativa' },
              {
                src: 'https://www.utadeo.edu.co/sites/tadeo/files/node/article/field_header_image/foto2_credito_juan_manuel_barrero_bueno.jpg',
                alt: 'Productores trabajando en un cultivo de papa.', label: 'Trabajo en el cultivo', credit: 'Universidad Jorge Tadeo Lozano',
                href: 'https://www.utadeo.edu.co/es/articulo/crossmedialab/277626/del-campo-la-mesa-los-depredadores-de-la-cadena-alimentaria',
              },
              {
                src: 'https://caracol.com.co/resizer/v2/LBZAVDBCEZKZNCFEVBZULSMSLI.jpg?auth=a832bde5139ff359d56e9ab5a9ff3f2c75aa3cc17c5b3b54e3553cc71fc2ecce&height=675&quality=70&smart=true&width=1200',
                alt: 'Campesinos trabajando en la siembra.', label: 'Siembra campesina', credit: 'Caracol Radio',
                href: 'https://caracol.com.co/radio/2015/08/12/nacional/1439345733_491568.html',
              },
            ].map((photo) => (
              <figure key={photo.src} className="group relative h-36 overflow-hidden rounded-xl bg-[#173b2b] shadow-sm sm:h-40">
                <img src={photo.src} alt={photo.alt} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092b21]/80 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-3 bottom-2.5 text-white">
                  <span className="block text-sm font-semibold leading-tight">{photo.label}</span>
                  {photo.href ? (
                    <a href={photo.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-white/75 underline decoration-white/40 underline-offset-2">Foto: {photo.credit}</a>
                  ) : (
                    <span className="mt-1 block text-[10px] text-white/75">{photo.credit}</span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>

          <blockquote className="mt-5 max-w-lg border-l-2 border-[#b77a2c] pl-4 text-sm leading-6 text-[#59645e]">
            <p className="font-editorial text-lg leading-6 text-[#173b2b]">
              “Detrás de cada cosecha hay conocimiento, esfuerzo y una familia que merece oportunidades justas.”
            </p>
            <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8a4c12]">
              El propósito de AgroCórdoba · ODS 8
            </footer>
          </blockquote>

          <div className="mt-4 flex gap-3 rounded-2xl border border-[#d8dfd2] bg-white/75 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3e9] text-[#176044]">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-[#59645e]">
              AgroCórdoba ayuda a dar visibilidad a las cosechas y a conectar a quienes las producen con nuevos compradores.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a4c12]">
            <Leaf className="h-4 w-4" aria-hidden="true" />
            Respuestas para comprar y vender
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <article
                  key={item.q}
                  className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${isOpen ? 'border-[#d8dfd2] shadow-[0_8px_24px_rgba(24,36,29,0.06)]' : 'border-[#e4dfd2]/70 shadow-sm'}`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleAccordion(idx)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-[#fbfaf6] sm:px-6"
                    >
                      <span className="font-display text-sm font-bold leading-6 text-[#17231c] sm:text-base">
                        {item.q}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8d9b7] bg-[#f7f6ef] text-[#174b38]">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${idx}`}
                    hidden={!isOpen}
                    className="border-t border-[#e4dfd2]/70 px-5 pb-5 pt-4 text-sm leading-7 text-[#4f5d54] sm:px-6"
                  >
                    <p>{item.a}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-[#07503f] p-5 text-white sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#e8fe85]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">Antes de cerrar una cotización</h3>
                <p className="mt-1 text-sm leading-6 text-white/80">
                  Confirma disponibilidad, cantidad, precio final, transporte y forma de pago directamente con la otra parte.
                </p>
                <a href="#catalogo" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#e8fe85] hover:underline">
                  Explorar el catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
