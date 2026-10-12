import React, { useRef, useState } from 'react';

import {
  ArrowLeft,
  Camera,
  Check,
  Mail,
  MapPin,
  Phone,
  Save,
  Store,
  Trash2,
  User,
} from 'lucide-react';

import {
  UserProfile,
  BusinessType,
} from '../types';


interface BuyerProfileProps {

  user: UserProfile;

  onBack: () => void;

  onUpdateProfile: (
    updated: Partial<UserProfile>
  ) => void;

}


const BuyerProfile: React.FC<BuyerProfileProps> = ({
  user,
  onBack,
  onUpdateProfile,
}) => {


  // =====================================================
  // ESTADOS
  // =====================================================

  const [name, setName] =
    useState(user.name);

  const [phone, setPhone] =
    useState(user.phone || '');

  const [businessType, setBusinessType] =
    useState<BusinessType>(
      user.businessType
    );

  const [city, setCity] =
    useState(user.city || '');

  const [avatar, setAvatar] =
    useState(user.avatar || '');

  const [saved, setSaved] =
    useState(false);

  const [removePhotoConfirm, setRemovePhotoConfirm] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);


  // =====================================================
  // CAMBIAR FOTO
  // =====================================================

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // Validar tipo

    if (!file.type.startsWith('image/')) {

      alert(
        'Selecciona una imagen válida.'
      );

      return;
    }


    // Máximo 5 MB

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        'La imagen no puede superar los 5 MB.'
      );

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      const result =
        reader.result as string;

      setAvatar(result);

      setSaved(false);

    };


    reader.readAsDataURL(file);

  };


  // =====================================================
  // QUITAR FOTO
  // =====================================================

  const handleRemovePhoto = () => {

    setAvatar('');

    setRemovePhotoConfirm(
      false
    );

    setSaved(false);

  };


  // =====================================================
  // GUARDAR CAMBIOS
  // =====================================================

  const handleSave = () => {

    if (!name.trim()) {

      alert(
        'El nombre no puede estar vacío.'
      );

      return;
    }


    onUpdateProfile({

      name:
        name.trim(),

      phone:
        phone.trim(),

      businessType,

      city:
        city.trim(),

      avatar,

    });


    setSaved(true);


    setTimeout(() => {

      setSaved(false);

    }, 3000);

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7f2',
        color: '#172018',
        paddingBottom: '70px',
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <section
        style={{
          background:
            'linear-gradient(120deg, #294500 0%, #496c09 55%, #6f8e17 100%)',
          color: '#ffffff',
          padding:
            '45px 6% 70px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >

        {/* Decoración */}

        <div
          style={{
            position: 'absolute',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background:
              'rgba(255,255,255,0.045)',
            right: '-120px',
            top: '-250px',
          }}
        />


        <div
          style={{
            maxWidth: '1150px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}
        >

          {/* VOLVER */}

          <button
            onClick={onBack}
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding:
                '9px 14px',
              borderRadius:
                '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >

            <ArrowLeft
              size={16}
            />

            Volver al Dashboard

          </button>


          <div
            style={{
              marginTop: '30px',
            }}
          >

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.8,
                fontWeight: 600,
              }}
            >
              CUENTA DEL COMPRADOR
            </p>


            <h1
              style={{
                margin:
                  '8px 0 0',
                fontSize:
                  'clamp(40px, 6vw, 62px)',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing:
                  '-2px',
              }}
            >
              Mi perfil
            </h1>


            <p
              style={{
                margin:
                  '17px 0 0',
                maxWidth: '620px',
                fontSize: '16px',
                lineHeight: 1.6,
                opacity: 0.85,
              }}
            >
              Administra tu información personal
              y mantén actualizados los datos de
              tu cuenta en AgroCórdoba.
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          CONTENIDO
      ================================================= */}

      <main
        style={{
          maxWidth: '1050px',
          margin: '-38px auto 0',
          padding:
            '0 20px',
          position: 'relative',
          zIndex: 5,
        }}
      >

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(280px, 0.8fr) minmax(0, 1.5fr)',
            gap: '22px',
          }}
        >

          {/* =================================================
              TARJETA DE FOTO
          ================================================= */}

          <section
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #e3e8df',
              borderRadius:
                '24px',
              padding:
                '30px',
              boxShadow:
                '0 12px 35px rgba(30,50,25,0.08)',
              height:
                'fit-content',
            }}
          >

            <div
              style={{
                textAlign:
                  'center',
              }}
            >

              <div
                style={{
                  width: '145px',
                  height: '145px',
                  borderRadius:
                    '38px',
                  overflow:
                    'hidden',
                  background:
                    '#edf7df',
                  color:
                    '#365004',
                  margin:
                    '0 auto 20px',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  border:
                    '5px solid #ffffff',
                  boxShadow:
                    '0 8px 25px rgba(30,50,25,0.12)',
                }}
              >

                {avatar ? (

                  <img
                    src={avatar}
                    alt="Foto de perfil"
                    style={{
                      width:
                        '100%',
                      height:
                        '100%',
                      objectFit:
                        'cover',
                    }}
                  />

                ) : (

                  <User
                    size={55}
                  />

                )}

              </div>


              <h2
                style={{
                  margin: 0,
                  fontSize:
                    '20px',
                  fontWeight:
                    850,
                  color:
                    '#263126',
                }}
              >
                {name ||
                  'Tu nombre'}
              </h2>


              <p
                style={{
                  margin:
                    '5px 0 22px',
                  fontSize:
                    '12px',
                  color:
                    '#7c857d',
                }}
              >
                Comprador AgroCórdoba
              </p>


              {/* INPUT FOTO */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={
                  handlePhotoChange
                }
                style={{
                  display:
                    'none',
                }}
              />


              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '12px',
                  border:
                    'none',
                  borderRadius:
                    '12px',
                  background:
                    '#365004',
                  color:
                    '#ffffff',
                  fontWeight:
                    750,
                  cursor:
                    'pointer',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap:
                    '8px',
                }}
              >

                <Camera
                  size={17}
                />

                Cambiar foto

              </button>


              {avatar && (

                <button
                  onClick={() =>
                    setRemovePhotoConfirm(
                      true
                    )
                  }
                  style={{
                    width:
                      '100%',
                    marginTop:
                      '9px',
                    padding:
                      '11px',
                    border:
                      '1px solid #f1d7d4',
                    borderRadius:
                      '12px',
                    background:
                      '#fff8f7',
                    color:
                      '#b42318',
                    fontWeight:
                      700,
                    cursor:
                      'pointer',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    gap:
                      '8px',
                  }}
                >

                  <Trash2
                    size={16}
                  />

                  Quitar foto

                </button>

              )}


              <p
                style={{
                  margin:
                    '15px 0 0',
                  fontSize:
                    '10px',
                  color:
                    '#9aa29b',
                  lineHeight:
                    1.5,
                }}
              >
                JPG, PNG o WEBP
                <br />
                Máximo 5 MB
              </p>

            </div>

          </section>


          {/* =================================================
              INFORMACIÓN PERSONAL
          ================================================= */}

          <section
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #e3e8df',
              borderRadius:
                '24px',
              padding:
                '30px',
              boxShadow:
                '0 12px 35px rgba(30,50,25,0.08)',
            }}
          >

            <div
              style={{
                marginBottom:
                  '25px',
              }}
            >

              <h2
                style={{
                  margin: 0,
                  fontSize:
                    '22px',
                  fontWeight:
                    850,
                }}
              >
                Información personal
              </h2>


              <p
                style={{
                  margin:
                    '6px 0 0',
                  color:
                    '#7b847c',
                  fontSize:
                    '13px',
                }}
              >
                Actualiza los datos asociados a
                tu cuenta.
              </p>

            </div>


            {/* NOMBRE */}

            <div
              style={{
                marginBottom:
                  '18px',
              }}
            >

              <label
                style={{
                  display:
                    'block',
                  marginBottom:
                    '7px',
                  fontSize:
                    '12px',
                  fontWeight:
                    750,
                  color:
                    '#475147',
                }}
              >
                Nombre completo
              </label>


              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <User
                  size={17}
                  style={{
                    position:
                      'absolute',
                    left:
                      '14px',
                    top:
                      '14px',
                    color:
                      '#8a938b',
                  }}
                />


                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '12px 14px 12px 42px',
                    border:
                      '1px solid #dce3d8',
                    borderRadius:
                      '11px',
                    outline:
                      'none',
                    fontSize:
                      '13px',
                    color:
                      '#263126',
                    background:
                      '#fbfcfa',
                  }}
                />

              </div>

            </div>


            {/* CORREO */}

            <div
              style={{
                marginBottom:
                  '18px',
              }}
            >

              <label
                style={{
                  display:
                    'block',
                  marginBottom:
                    '7px',
                  fontSize:
                    '12px',
                  fontWeight:
                    750,
                  color:
                    '#475147',
                }}
              >
                Correo electrónico
              </label>


              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <Mail
                  size={17}
                  style={{
                    position:
                      'absolute',
                    left:
                      '14px',
                    top:
                      '14px',
                    color:
                      '#8a938b',
                  }}
                />


                <input
                  value={
                    user.email
                  }
                  disabled
                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '12px 14px 12px 42px',
                    border:
                      '1px solid #e5e9e3',
                    borderRadius:
                      '11px',
                    outline:
                      'none',
                    fontSize:
                      '13px',
                    color:
                      '#8a938b',
                    background:
                      '#f3f5f1',
                    cursor:
                      'not-allowed',
                  }}
                />

              </div>


              <p
                style={{
                  margin:
                    '6px 0 0',
                  fontSize:
                    '10px',
                  color:
                    '#9aa19b',
                }}
              >
                El correo se utiliza como identificador
                de tu cuenta.
              </p>

            </div>


            {/* TELÉFONO */}

            <div
              style={{
                marginBottom:
                  '18px',
              }}
            >

              <label
                style={{
                  display:
                    'block',
                  marginBottom:
                    '7px',
                  fontSize:
                    '12px',
                  fontWeight:
                    750,
                  color:
                    '#475147',
                }}
              >
                Teléfono
              </label>


              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <Phone
                  size={17}
                  style={{
                    position:
                      'absolute',
                    left:
                      '14px',
                    top:
                      '14px',
                    color:
                      '#8a938b',
                  }}
                />


                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="+57 300 000 0000"
                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '12px 14px 12px 42px',
                    border:
                      '1px solid #dce3d8',
                    borderRadius:
                      '11px',
                    outline:
                      'none',
                    fontSize:
                      '13px',
                    color:
                      '#263126',
                    background:
                      '#fbfcfa',
                  }}
                />

              </div>

            </div>


            {/* DOS COLUMNAS */}

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap:
                  '15px',
                marginBottom:
                  '25px',
              }}
            >

              {/* NEGOCIO */}

              <div>

                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '7px',
                    fontSize:
                      '12px',
                    fontWeight:
                      750,
                    color:
                      '#475147',
                  }}
                >
                  Tipo de negocio
                </label>


                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <Store
                    size={17}
                    style={{
                      position:
                        'absolute',
                      left:
                        '14px',
                      top:
                        '13px',
                      color:
                        '#8a938b',
                      pointerEvents:
                        'none',
                    }}
                  />


                  <select
                    value={
                      businessType
                    }
                    onChange={(e) =>
                      setBusinessType(
                        e.target.value as BusinessType
                      )
                    }
                    style={{
                      width:
                        '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '12px 12px 12px 42px',
                      border:
                        '1px solid #dce3d8',
                      borderRadius:
                        '11px',
                      outline:
                        'none',
                      fontSize:
                        '13px',
                      color:
                        '#263126',
                      background:
                        '#fbfcfa',
                    }}
                  >

                    <option value="Hogar">
                      Hogar
                    </option>

                    <option value="Restaurante">
                      Restaurante
                    </option>

                    <option value="Distribuidor">
                      Distribuidor
                    </option>

                    <option value="Importador">
                      Importador
                    </option>

                  </select>

                </div>

              </div>


              {/* MUNICIPIO */}

              <div>

                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '7px',
                    fontSize:
                      '12px',
                    fontWeight:
                      750,
                    color:
                      '#475147',
                  }}
                >
                  Municipio
                </label>


                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <MapPin
                    size={17}
                    style={{
                      position:
                        'absolute',
                      left:
                        '14px',
                      top:
                        '13px',
                      color:
                        '#8a938b',
                    }}
                  />


                  <input
                    value={city}
                    onChange={(e) =>
                      setCity(
                        e.target.value
                      )
                    }
                    placeholder="Montería"
                    style={{
                      width:
                        '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '12px 12px 12px 42px',
                      border:
                        '1px solid #dce3d8',
                      borderRadius:
                        '11px',
                      outline:
                        'none',
                      fontSize:
                        '13px',
                      color:
                        '#263126',
                      background:
                        '#fbfcfa',
                    }}
                  />

                </div>

              </div>

            </div>


            {/* BOTÓN GUARDAR */}

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                alignItems:
                  'center',
                gap:
                  '12px',
              }}
            >

              {saved && (

                <span
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap:
                      '5px',
                    color:
                      '#16753b',
                    fontSize:
                      '12px',
                    fontWeight:
                      700,
                  }}
                >

                  <Check
                    size={16}
                  />

                  Cambios guardados

                </span>

              )}


              <button
                onClick={
                  handleSave
                }
                style={{
                  border:
                    'none',
                  background:
                    '#365004',
                  color:
                    '#ffffff',
                  padding:
                    '12px 20px',
                  borderRadius:
                    '12px',
                  fontWeight:
                    750,
                  cursor:
                    'pointer',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap:
                    '8px',
                  boxShadow:
                    '0 7px 18px rgba(54,80,4,0.18)',
                }}
              >

                <Save
                  size={17}
                />

                Guardar cambios

              </button>

            </div>

          </section>

        </div>

      </main>


      {/* =================================================
          MODAL CONFIRMAR QUITAR FOTO
      ================================================= */}

      {removePhotoConfirm && (

        <div
          style={{
            position:
              'fixed',
            inset: 0,
            background:
              'rgba(20,30,20,0.55)',
            backdropFilter:
              'blur(4px)',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            zIndex:
              100,
            padding:
              '20px',
          }}
        >

          <div
            style={{
              width:
                '100%',
              maxWidth:
                '390px',
              background:
                '#ffffff',
              borderRadius:
                '22px',
              padding:
                '28px',
              boxShadow:
                '0 25px 70px rgba(0,0,0,0.25)',
              textAlign:
                'center',
            }}
          >

            <div
              style={{
                width:
                  '52px',
                height:
                  '52px',
                borderRadius:
                  '15px',
                background:
                  '#fff0ee',
                color:
                  '#b42318',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                margin:
                  '0 auto 15px',
              }}
            >

              <Trash2
                size={23}
              />

            </div>


            <h2
              style={{
                margin: 0,
                fontSize:
                  '20px',
                fontWeight:
                  850,
              }}
            >
              ¿Quitar foto de perfil?
            </h2>


            <p
              style={{
                margin:
                  '9px 0 23px',
                color:
                  '#737c74',
                fontSize:
                  '13px',
                lineHeight:
                  1.5,
              }}
            >
              Tu foto será eliminada de tu
              perfil y volverá a mostrarse
              el ícono predeterminado.
            </p>


            <div
              style={{
                display:
                  'flex',
                gap:
                  '10px',
              }}
            >

              <button
                onClick={() =>
                  setRemovePhotoConfirm(
                    false
                  )
                }
                style={{
                  flex:
                    1,
                  padding:
                    '11px',
                  border:
                    '1px solid #dce3d8',
                  background:
                    '#ffffff',
                  color:
                    '#485148',
                  borderRadius:
                    '11px',
                  fontWeight:
                    700,
                  cursor:
                    'pointer',
                }}
              >
                Cancelar
              </button>


              <button
                onClick={
                  handleRemovePhoto
                }
                style={{
                  flex:
                    1,
                  padding:
                    '11px',
                  border:
                    'none',
                  background:
                    '#b42318',
                  color:
                    '#ffffff',
                  borderRadius:
                    '11px',
                  fontWeight:
                    750,
                  cursor:
                    'pointer',
                }}
              >
                Sí, quitar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};


export default BuyerProfile;