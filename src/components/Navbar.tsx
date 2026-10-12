import React from 'react';
import {
  ShieldCheck,
  Menu,
  X,
  UserCircle,
} from 'lucide-react';

import { UserProfile } from '../types';
import { AgroCordobaBrand } from './AgroCordobaBrand';

interface NavbarProps {
  currency: 'COP' | 'USD';
  onToggleCurrency: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (
    initialTab?: 'login' | 'register' | 'profile'
  ) => void;
  onOpenAdmin: () => void;
  isAdminView: boolean;
  onExitAdmin: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currency,
  onToggleCurrency,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  isAdminView,
  onExitAdmin,
  activeSection,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] =
    React.useState(false);

  const navigate = (section: string) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isLanding = !currentUser && !isAdminView;

  const getRoleLabel = () => {
    if (!currentUser) return '';

    switch (currentUser.role) {
      case 'admin':
        return 'Administrador';

      case 'productor':
        return 'Productor';

      case 'cliente':
        return 'Comprador';

      default:
        return '';
    }
  };

  return (
    <header className={isLanding
      ? 'absolute inset-x-0 top-0 z-50 text-white'
      : 'sticky top-0 z-50 border-b border-[#e5dfd1] bg-[#faf8f2] text-[#1d211b]'}>

      {/* =====================================================
          NAVBAR PRINCIPAL
      ====================================================== */}

      {isLanding && (
        <div className="h-7 overflow-hidden bg-white text-[#07503f]" aria-label="Cosechas de Córdoba, del campo a tu mesa">
          <div className="agro-marquee-track flex h-full w-max items-center gap-8 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} aria-hidden={index > 0}>
                Cosechas de Córdoba <span className="px-2">✳</span> Origen local <span className="px-2">✳</span> Trato directo con productores <span className="px-2">✳</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className={`max-w-[1400px] mx-auto px-6 lg:px-10 h-[82px] flex items-center justify-between ${isLanding ? 'bg-gradient-to-b from-[#062f26]/60 to-transparent' : ''}`}>

        {/* =================================================
            LOGO
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            if (isAdminView) {
              onExitAdmin();
            }

            navigate('hero');
          }}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-logo"
        >
          <AgroCordobaBrand theme={isLanding ? 'dark' : 'light'} />
        </button>

        {/* =================================================
            NAVEGACIÓN DESKTOP
        ================================================= */}

        {!isAdminView && (
          <nav className="hidden lg:flex items-center gap-8">

            <button
              type="button"
              onClick={() => navigate('hero')}
              className={`text-sm transition ${
                activeSection === 'hero'
                  ? isLanding ? 'text-[#e8fe85] font-semibold' : 'text-[#138b45] font-semibold'
                  : isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'
              }`}
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() => navigate('catalogo')}
              className={`text-sm transition ${
                activeSection === 'catalogo'
                  ? isLanding ? 'text-[#e8fe85] font-semibold' : 'text-[#138b45] font-semibold'
                  : isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'
              }`}
            >
              Cosechas
            </button>

            <button
              type="button"
              onClick={() => navigate('mapa')}
              className={`text-sm transition ${
                activeSection === 'mapa'
                  ? isLanding ? 'text-[#e8fe85] font-semibold' : 'text-[#138b45] font-semibold'
                  : isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'
              }`}
            >
              Regiones
            </button>

            <button
              type="button"
              onClick={() => navigate('como-funciona')}
              className={`text-sm transition ${
                activeSection === 'como-funciona'
                  ? isLanding ? 'text-[#e8fe85] font-semibold' : 'text-[#138b45] font-semibold'
                  : isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'
              }`}
            >
              Cómo funciona
            </button>

            <button
              type="button"
              onClick={() => navigate('faq')}
              className={`text-sm transition ${
                activeSection === 'faq'
                  ? isLanding ? 'text-[#e8fe85] font-semibold' : 'text-[#138b45] font-semibold'
                  : isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'
              }`}
            >
              Contacto
            </button>

          </nav>
        )}

        {/* =================================================
            ACCIONES
        ================================================= */}

        <div className="flex items-center gap-3">

          {/* =================================================
              MONEDA
          ================================================= */}

          {isAdminView && (
            <button
              id="currency-toggle-btn"
              type="button"
              onClick={onToggleCurrency}
              title="Cambiar moneda"
              className="hidden md:flex items-center bg-[#f0ece1] border border-[#ddd6c7] rounded-full p-1 text-xs"
            >
            <span
              className={`px-3 py-1 rounded-full transition ${
                currency === 'COP'
                  ? 'bg-white text-[#145b32] shadow-sm font-semibold'
                  : 'text-[#77776e]'
              }`}
            >
              COP
            </span>

            <span
              className={`px-3 py-1 rounded-full transition ${
                currency === 'USD'
                  ? 'bg-white text-[#145b32] shadow-sm font-semibold'
                  : 'text-[#77776e]'
              }`}
            >
              USD
            </span>
            </button>
          )}

          {/* =================================================
              USUARIO
          ================================================= */}

          {currentUser ? (
            <button
              id="btn-user-profile"
              type="button"
              onClick={() => onOpenAuth('profile')}
              className="flex items-center gap-2 bg-[#f0ece1] hover:bg-[#e9e4d7] border border-[#ddd6c7] pl-2 pr-4 py-1.5 rounded-full transition"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#d4cdbd]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#dcebdc] flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-[#138b45]" />
                </div>
              )}

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#263027]">
                  {currentUser.name.split(' ')[0]}
                </p>

                <p className="text-[10px] text-[#7a786f]">
                  {getRoleLabel()}
                </p>
              </div>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-3">

              <button
                id="btn-login"
                type="button"
                onClick={() => onOpenAuth('login')}
                className={`text-sm font-medium transition ${isLanding ? 'text-white/90 hover:text-white' : 'text-[#45483f] hover:text-[#138b45]'}`}
              >
                Ingresar
              </button>

              <button
                id="btn-register"
                type="button"
                onClick={() => onOpenAuth('register')}
                className="bg-[#e8fe85] hover:bg-[#d9ef78] text-[#07503f] text-sm font-semibold px-5 py-2.5 rounded-full transition shadow-sm"
              >
                Mi cuenta
              </button>

            </div>
          )}

          {/* =================================================
              ADMINISTRADOR
              SOLO PARA ROLE ADMIN
          ================================================= */}

          {isAdmin && (
            <>
              {!isAdminView ? (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hidden md:flex items-center gap-2 bg-[#eef4ec] hover:bg-[#dfeedd] text-[#145b32] border border-[#cfe1ce] px-4 py-2 rounded-full text-sm font-semibold transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Administrador
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onExitAdmin}
                  className="hidden md:flex items-center gap-2 bg-[#e5a832] hover:bg-[#d89a25] text-[#332400] px-4 py-2 rounded-full text-sm font-semibold transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Salir del administrador
                </button>
              )}
            </>
          )}

          {/* =================================================
              MOBILE
          ================================================= */}

          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            className={`lg:hidden rounded-full p-2 ${isLanding ? 'text-white hover:bg-white/15' : 'text-[#263027] hover:bg-[#eee9dd]'}`}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

        </div>
      </div>

      {/* =====================================================
          MENÚ MÓVIL
      ====================================================== */}

      {mobileMenuOpen && (
        <div className={`lg:hidden border-t px-6 py-5 ${isLanding ? 'border-white/20 bg-[#07503f] text-white' : 'border-[#e5dfd1] bg-[#faf8f2]'}`}>

          <div className="flex flex-col gap-2">

            <button
              type="button"
              onClick={() => navigate('hero')}
              className={`text-left px-4 py-3 rounded-full ${isLanding ? 'text-white hover:bg-white/10' : 'text-[#343930] hover:bg-[#eef4ec]'}`}
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() => navigate('catalogo')}
              className={`text-left px-4 py-3 rounded-full ${isLanding ? 'text-white hover:bg-white/10' : 'text-[#343930] hover:bg-[#eef4ec]'}`}
            >
              Cosechas
            </button>

            <button
              type="button"
              onClick={() => navigate('mapa')}
              className={`text-left px-4 py-3 rounded-full ${isLanding ? 'text-white hover:bg-white/10' : 'text-[#343930] hover:bg-[#eef4ec]'}`}
            >
              Regiones
            </button>

            <button
              type="button"
              onClick={() => navigate('como-funciona')}
              className={`text-left px-4 py-3 rounded-full ${isLanding ? 'text-white hover:bg-white/10' : 'text-[#343930] hover:bg-[#eef4ec]'}`}
            >
              Cómo funciona
            </button>

            <button
              type="button"
              onClick={() => navigate('faq')}
              className={`text-left px-4 py-3 rounded-full ${isLanding ? 'text-white hover:bg-white/10' : 'text-[#343930] hover:bg-[#eef4ec]'}`}
            >
              Contacto
            </button>

            {/* =================================================
                CUENTA
            ================================================= */}

            <div className="border-t border-[#e5dfd1] mt-3 pt-4">

              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('profile');
                    setMobileMenuOpen(false);
                  }}
                    className="w-full bg-[#e8fe85] text-[#07503f] py-3 rounded-full font-semibold"
                >
                  Mi cuenta
                </button>
              ) : (
                <div className="flex flex-col gap-2">

                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-3 border rounded-full ${isLanding ? 'border-white/40 text-white' : 'border-[#d9d2c3] text-[#343930]'}`}
                  >
                    Ingresar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-[#e8fe85] text-[#07503f] rounded-full font-semibold"
                  >
                    Crear cuenta
                  </button>

                </div>
              )}

            </div>

            {/* =================================================
                ADMIN SOLO SI ES ADMIN
            ================================================= */}

            {isAdmin && (
              <div className="border-t border-[#e5dfd1] mt-3 pt-4">

                {!isAdminView ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 text-[#145b32] bg-[#eef4ec] rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Portal administrador
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onExitAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-[#e5a832] text-[#332400] rounded-full font-semibold"
                  >
                    Salir del administrador
                  </button>
                )}

              </div>
            )}

          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
