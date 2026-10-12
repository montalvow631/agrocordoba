import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  MapPin,
  Thermometer,
  Sprout,
  Users,
  PackageCheck,
  ArrowRight,
  Compass,
  ShieldCheck,
  Map as MapIcon,
  ZoomIn,
} from 'lucide-react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';

import {
  divIcon,
  latLngBounds,
  LatLngBoundsExpression,
} from 'leaflet';


import { MUNICIPALITIES } from '../data/mockData';
import { Municipality } from '../types';

interface CordobaMapProps {
  selectedMunicipalityId: string;
  onSelectMunicipality: (mId: string) => void;
  onFilterCatalogByMunicipality: (mId: string) => void;
}

/* ============================================================
   COORDENADAS REALES DE LOS MUNICIPIOS DE CÓRDOBA
   (se buscan por id o por nombre del municipio)
============================================================ */

const CORDOBA_COORDS: Record<string, [number, number]> = {
  'monteria': [8.7479, -75.8814],
  'lorica': [9.2364, -75.8135],
  'cerete': [8.8853, -75.7906],
  'cienaga-de-oro': [8.875, -75.6211],
  'sahagun': [8.9465, -75.443],
  'tierralta': [8.173, -76.0592],
  'montelibano': [7.9792, -75.4183],
  'planeta-rica': [8.4089, -75.5853],
  'san-pelayo': [8.9583, -75.8361],
  'chinu': [9.105, -75.398],
  'ayapel': [8.3127, -75.145],
  'san-antero': [9.3747, -75.7586],
  'san-bernardo-del-viento': [9.353, -75.954],
  'monitos': [9.246, -76.129],
  'puerto-escondido': [9.016, -76.261],
  'los-cordobas': [8.893, -76.354],
  'canalete': [8.788, -76.242],
  'valencia': [8.256, -76.147],
  'san-carlos': [8.798, -75.699],
  'purisima': [9.237, -75.723],
  'momil': [9.238, -75.676],
  'chima': [9.148, -75.627],
  'cotorra': [9.039, -75.792],
  'san-andres-de-sotavento': [9.146, -75.509],
  'tuchin': [9.186, -75.555],
  'la-apartada': [8.05, -75.336],
  'buenavista': [8.221, -75.482],
  'pueblo-nuevo': [8.504, -75.508],
  'puerto-libertador': [7.888, -75.671],
  'san-jose-de-ure': [7.788, -75.534],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCoords = (
  municipality: Municipality
): [number, number] | null => {
  const m = municipality as Municipality & {
    lat?: number;
    lng?: number;
  };

  if (typeof m.lat === 'number' && typeof m.lng === 'number') {
    return [m.lat, m.lng];
  }

  return (
    CORDOBA_COORDS[normalize(municipality.id)] ||
    CORDOBA_COORDS[normalize(municipality.name)] ||
    null
  );
};

/* ============================================================
   CONFIGURACIÓN DEL MAPA
============================================================ */

const CORDOBA_CENTER: [number, number] = [8.55, -75.7];

const CORDOBA_BOUNDS: LatLngBoundsExpression = [
  [7.5, -76.7],
  [9.7, -74.8],
];

/* ============================================================
   IMÁGENES REPRESENTATIVAS
   (deben coincidir EXACTAMENTE con los nombres en public/images)
============================================================ */

const MUNICIPALITY_IMAGES: Record<string, { src: string; crop: string }> = {
  monteria: { src: '/images/field-maize.webp', crop: 'Maíz' },
  cerete: { src: '/images/platano-real.jpg', crop: 'Plátano' },
  lorica: { src: '/images/mango-real.jpg', crop: 'Mango' },
  sahagun: { src: '/images/name-real.jpg', crop: 'Ñame' },
  tierralta: { src: '/images/cacao-real.jpg', crop: 'Cacao' },
  montelibano: { src: '/images/arroz-real.jpg', crop: 'Arroz' },
  'planeta-rica': { src: '/images/yuca-real.jpg', crop: 'Yuca' },
  'cienaga-de-oro': { src: '/images/yuca-real.jpg', crop: 'Yuca y casabe' },
};

/* ============================================================
   ICONO PERSONALIZADO
============================================================ */

const createMunicipalityIcon = (
  selected: boolean,
  capital: boolean
) => {
  const color = selected
    ? '#a14b00'
    : capital
      ? '#0f766e'
      : '#14532d';

  const size = selected ? 42 : 32;

  return divIcon({
    className: 'agrocordoba-marker-wrapper',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        border:4px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,.30)${
          selected ? ',0 0 0 6px rgba(161,75,0,.25)' : ''
        };
        display:flex;
        align-items:center;
        justify-content:center;
        position:relative;
      ">
        <div style="
          width:${selected ? 12 : 8}px;
          height:${selected ? 12 : 8}px;
          background:${selected ? '#e8d9b7' : 'white'};
          border-radius:50%;
        "></div>
        <div style="
          position:absolute;
          bottom:-10px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:10px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 4)],
  });
};

/* ============================================================
   CONTROL DEL MAPA
   - Al cargar: muestra los 8 municipios completos
   - Al seleccionar: vuela al municipio
============================================================ */

interface MapControllerProps {
  activeCoords: [number, number] | null;
  allCoords: [number, number][];
}

const MapController: React.FC<MapControllerProps> = ({
  activeCoords,
  allCoords,
}) => {
  const map = useMap();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;

      if (allCoords.length > 0) {
        map.fitBounds(latLngBounds(allCoords), {
          padding: [50, 50],
        });
      }

      return;
    }

    if (!activeCoords) return;

    map.flyTo(activeCoords, 12, { duration: 1.2 });
  }, [activeCoords, allCoords, map]);

  return null;
};

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export const CordobaMap: React.FC<CordobaMapProps> = ({
  selectedMunicipalityId,
  onSelectMunicipality,
  onFilterCatalogByMunicipality,
}) => {
  const [activeMuni, setActiveMuni] = useState<Municipality>(
    MUNICIPALITIES.find((m) => m.id === selectedMunicipalityId) ||
      MUNICIPALITIES[0]
  );

  useEffect(() => {
    const municipality = MUNICIPALITIES.find(
      (m) => m.id === selectedMunicipalityId
    );

    if (municipality) {
      setActiveMuni(municipality);
    }
  }, [selectedMunicipalityId]);

  const handleSelect = (municipality: Municipality) => {
    setActiveMuni(municipality);
    onSelectMunicipality(municipality.id);
  };

  /* Municipios con coordenadas */

  const mappedMunicipalities = useMemo(
    () =>
      MUNICIPALITIES.map((m) => ({
        municipality: m,
        coords: getCoords(m),
      })).filter(
        (item): item is {
          municipality: Municipality;
          coords: [number, number];
        } => item.coords !== null
      ),
    []
  );

  const allCoords = useMemo(
    () => mappedMunicipalities.map((item) => item.coords),
    [mappedMunicipalities]
  );

  const activeCoords = useMemo(
    () => getCoords(activeMuni),
    [activeMuni]
  );

  const activeImage = MUNICIPALITY_IMAGES[activeMuni.id] ?? {
    src: '/images/field-aerial-1.webp',
    crop: activeMuni.leadCrops[0] ?? 'Cultivo local',
  };

  const totalFarmers = useMemo(
    () =>
      MUNICIPALITIES.reduce(
        (total, m) => total + (m.activeFarmersCount || 0),
        0
      ),
    []
  );

  return (
    <section
      id="mapa"
      className="border-y border-[#e4dfd2] bg-[#f1efe6] py-16"
    >
      {/* Estilo de las etiquetas de los municipios */}
      <style>{`
        .agrocordoba-marker-wrapper {
          background: transparent;
          border: none;
        }
        .leaflet-tooltip.agrocordoba-map-label {
          background: white;
          border: 1px solid #e4dfd2;
          border-radius: 8px;
          padding: 3px 8px;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,.15);
        }
        .leaflet-tooltip.agrocordoba-map-label::before {
          display: none;
        }
        .leaflet-tooltip.agrocordoba-map-label.is-active {
          background: #003622;
          border-color: #003622;
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* ENCABEZADO */}

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003622] uppercase tracking-wider bg-[#e8d9b7] px-3 py-1 rounded-full mb-3">
            <Compass className="w-3.5 h-3.5" />
            Geografía Agraria y Origen
          </div>

          <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-[#151d19]">
            Mapa Interactivo de las 8 Regiones de Córdoba
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#404943] max-w-2xl leading-relaxed">
            Explore la riqueza productiva de los valles del Sinú y San
            Jorge, las Sabanas y la Serranía de San Jerónimo. Seleccione
            cualquier municipio para conocer sus cultivos líderes y
            productores asociados.
          </p>
        </div>

        {/* CONTENEDOR PRINCIPAL */}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* MAPA REAL */}

          <div className="lg:col-span-8 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e4dfd2]/60">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e4dfd2]/40">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#003622]">
                    Departamento de Córdoba (Colombia)
                  </p>

                  <p className="text-xs text-[#707972] mt-0.5">
                    {mappedMunicipalities.length} municipios conectados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#707972]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14532d]" />
                  Municipio
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a14b00]" />
                  Seleccionado
                </span>
              </div>
            </div>

            {/* MAPA */}

            <div className="relative isolate h-[480px] sm:h-[560px] lg:h-[620px]">
              <MapContainer
                center={CORDOBA_CENTER}
                zoom={9}
                minZoom={8}
                maxZoom={17}
                maxBounds={CORDOBA_BOUNDS}
                maxBoundsViscosity={0.75}
                scrollWheelZoom={true}
                zoomControl={true}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                  activeCoords={activeCoords}
                  allCoords={allCoords}
                />

                {mappedMunicipalities.map(
                  ({ municipality, coords }) => {
                    const selected = municipality.id === activeMuni.id;

                    return (
                      <Marker
                        key={municipality.id}
                        position={coords}
                        icon={createMunicipalityIcon(
                          selected,
                          !!municipality.isCapital
                        )}
                        zIndexOffset={selected ? 1000 : 0}
                        eventHandlers={{
                          click: () => handleSelect(municipality),
                        }}
                      >
                        <Tooltip
                          direction="bottom"
                          offset={[0, 6]}
                          permanent
                          opacity={1}
                          className={`agrocordoba-map-label ${
                            selected ? 'is-active' : ''
                          }`}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: selected ? '#ffffff' : '#164e36',
                            }}
                          >
                            {municipality.name}
                          </span>
                        </Tooltip>

                        <Popup closeButton={true}>
                          <div style={{ minWidth: '220px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: '#dcfce7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MapPin size={18} color="#15803d" />
                              </div>

                              <div>
                                <strong
                                  style={{
                                    display: 'block',
                                    fontSize: '16px',
                                    color: '#173524',
                                  }}
                                >
                                  {municipality.name}
                                </strong>

                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#718078',
                                  }}
                                >
                                  {municipality.subregion}
                                </span>
                              </div>
                            </div>

                            <p
                              style={{
                                fontSize: '12px',
                                lineHeight: 1.5,
                                color: '#53605a',
                                margin: '0 0 10px',
                              }}
                            >
                              {municipality.shortDescription}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                onFilterCatalogByMunicipality(
                                  municipality.id
                                )
                              }
                              style={{
                                width: '100%',
                                border: 'none',
                                background: '#004d36',
                                color: 'white',
                                padding: '9px 12px',
                                borderRadius: '9px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Ver productos
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                )}
              </MapContainer>

              {/* INDICADOR SUPERIOR */}

              <div className="absolute top-4 left-14 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg border border-[#dce5dd] px-3 py-2 flex items-center gap-2 pointer-events-none">
                <MapIcon size={17} className="text-[#006b49]" />
                <span className="text-xs font-bold text-[#193a2b]">
                  Mapa real · Córdoba
                </span>
              </div>

              {/* AYUDA */}

              <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg border border-[#dce5dd] px-3 py-2 pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-[#59645e]">
                  <ZoomIn size={15} className="text-[#006b49]" />
                  <span>Haga clic en un municipio para acercarse</span>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DEL MUNICIPIO */}

          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-[#e4dfd2]/60 overflow-hidden flex flex-col">
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#d8f4e2] via-[#b8e8c9] to-[#8ed0a7]">
              <img
                key={activeMuni.id}
                src={activeImage.src}
                alt={`Fotografía de referencia de ${activeImage.crop} para ${activeMuni.name}`}
                className="h-full w-full object-cover transition-opacity duration-500"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallback !== 'true') {
                    image.dataset.fallback = 'true';
                    image.src = '/images/field-aerial-1.webp';
                    return;
                  }
                  image.style.display = 'none';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

              <div className="absolute left-4 bottom-4 text-white">
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-90">
                  Municipio seleccionado
                </div>
                <h3 className="text-2xl font-extrabold">
                  {activeMuni.name}
                </h3>
              </div>

              <span className="absolute right-4 bottom-4 rounded-full border border-white/30 bg-[#07503f]/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {activeImage.crop}
              </span>

              {activeMuni.isCapital && (
                <span className="absolute right-4 top-4 bg-[#e8d9b7] text-[#003622] px-3 py-1 rounded-full text-xs font-bold">
                  Capital
                </span>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider text-[#aa5500] mb-2">
                Subregión: {activeMuni.subregion}
              </div>

              <p className="text-sm text-[#4c5851] leading-6 mb-5">
                {activeMuni.shortDescription}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl border border-[#dbe8df] bg-[#f7fcf8] p-3">
                  <div className="flex items-center gap-2 text-xs text-[#718078] mb-2">
                    <Thermometer size={15} className="text-[#e07a00]" />
                    Clima y suelo
                  </div>
                  <div className="text-sm font-bold text-[#173b2b]">
                    {activeMuni.climate}
                  </div>
                </div>

                <div className="rounded-xl border border-[#dbe8df] bg-[#f7fcf8] p-3">
                  <div className="flex items-center gap-2 text-xs text-[#718078] mb-2">
                    <Users size={15} className="text-[#00865a]" />
                    Productores
                  </div>
                  <div className="text-lg font-extrabold text-[#173b2b]">
                    {activeMuni.activeFarmersCount}
                  </div>
                  <div className="text-[10px] text-[#7a847e]">
                    familias vinculadas
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#dbe8df] bg-[#f7fcf8] p-4 mb-5">
                <div className="flex items-center gap-2 text-xs text-[#718078] mb-2">
                  <PackageCheck size={16} className="text-[#00865a]" />
                  Oferta cosechada disponible
                </div>
                <div className="text-xl font-extrabold text-[#a95000]">
                  {activeMuni.availableTons.toLocaleString('es-CO')}{' '}
                  toneladas registradas
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#526058] mb-3">
                  <Sprout size={17} className="text-[#00865a]" />
                  Cultivos principales de la zona
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeMuni.leadCrops.map((crop) => (
                    <span
                      key={crop}
                      className="px-3 py-1.5 rounded-full bg-[#e9f8ef] border border-[#bce7cb] text-xs font-semibold text-[#075c3c]"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFilterCatalogByMunicipality(activeMuni.id)}
                className="mt-auto w-full flex items-center justify-center gap-2 bg-[#004d36] hover:bg-[#003c2b] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
              >
                Ver productos de {activeMuni.name}
                <ArrowRight size={17} />
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#708078]">
                <ShieldCheck size={14} className="text-[#00865a]" />
                Datos de referencia
              </div>
            </div>
          </div>
        </div>

        {/* PIE */}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6c7770]">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#00865a]" />
            <span>
              {totalFarmers.toLocaleString('es-CO')} productores
              registrados en los municipios mostrados
            </span>
          </div>

          <span>
            Cifras y datos municipales de esta demostración; confírmalos con
            fuentes locales antes de tomar decisiones.
          </span>
        </div>
      </div>
    </section>
  );
};

export default CordobaMap;
