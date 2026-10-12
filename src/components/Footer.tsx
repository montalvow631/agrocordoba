import React from 'react';
import { MapPin, Award, Phone, Handshake, Globe } from 'lucide-react';
import { MUNICIPALITIES } from '../data/mockData';
import { AgroCordobaBrand } from './AgroCordobaBrand';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onFilterByMunicipality: (muniId: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onFilterByMunicipality,
  onOpenAdmin,
}) => {
  return (
    <footer className="border-t border-[#394b3b] bg-[#17251b] pt-14 pb-8 text-[#f7f6ef]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-[#134e35]">
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <AgroCordobaBrand theme="dark" subtitle="AgroConecta · del campo a tu mesa" />

            <p className="text-xs text-[#e8d9b7]/80 leading-relaxed max-w-sm">
              Plataforma B2B para la desintermediación del campo cordobés. Conectamos pequeños productores rurales y cooperativas de base con hogares, restaurantes, distribuidores y compradores agroindustriales.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#e8d9b7]">
              <div className="flex items-center gap-1.5 bg-[#134e35] px-3 py-1.5 rounded-lg border border-[#e8d9b7]/20">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Inspirado en el ODS 8</span>
              </div>
            </div>
          </div>

          {/* Col 3: 8 Regiones de Origen */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-3">
              8 Municipios de Origen
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70">
              {MUNICIPALITIES.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      onFilterByMunicipality(m.id);
                      onNavigate('catalogo');
                    }}
                    className="hover:text-[#e8d9b7] transition text-left"
                  >
                    {m.name} {m.isCapital ? '(Capital)' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Enlaces Rápidos */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-3">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button
                  onClick={() => onNavigate('como-funciona')}
                  className="hover:text-[#e8d9b7] transition"
                >
                  ¿Cómo Funciona la Plataforma?
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogo')}
                  className="hover:text-[#e8d9b7] transition"
                >
                  Catálogo de Cosechas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('mapa')}
                  className="hover:text-[#e8d9b7] transition"
                >
                  Mapa de Córdoba
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('impacto')}
                  className="hover:text-[#e8d9b7] transition"
                >
                  Impacto Social y ODS 8
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-[#e8d9b7] transition"
                >
                  Preguntas Frecuentes
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition"
                >
                  Portal de Cooperativas (Admin)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Contacto Institucional */}
          <div>
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-3">
              Contacto directo
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#e8d9b7]" />
                <span>Montería, Córdoba - Colombia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#e8d9b7]" />
                <span>Contacta al productor desde su ficha de producto.</span>
              </li>
              <li className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-[#e8d9b7]" />
                <span>Las cotizaciones se coordinan directamente.</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#e8d9b7]" />
                <span>Valle del Sinú • San Jorge • Sabanas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#707972] gap-2">
          <p>© {new Date().getFullYear()} AgroCórdoba (AgroConecta). Desarrollado para la dignificación rural de Córdoba.</p>
          <div className="flex items-center gap-4">
              <span>Comercio directo</span>
            <span>•</span>
              <span>Córdoba, Colombia</span>
            <span>•</span>
              <span>Versión de demostración</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
