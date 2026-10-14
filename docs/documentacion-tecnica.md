# Documentación técnica de AgroCórdoba

> **Estado:** borrador técnico preparado a partir del código del repositorio. La revisión de contenido y la validación como aporte de Ayanis Sanabria están pendientes; no se atribuye esta versión a su cuenta ni a su autoría. Para que el historial de Git evidencie su trabajo, Ayanis debe revisar y modificar este documento y registrar esos cambios con su propia cuenta de GitHub.

## 1. Propósito y alcance

AgroCórdoba es una aplicación web para explorar productos agrícolas de Córdoba y conectar compradores con productores. La aplicación incluye una interfaz React, un backend Flask, persistencia mediante SQLAlchemy y una base SQLite predeterminada para desarrollo.

Esta documentación describe la implementación observada en el repositorio. No implica que el producto esté completo ni que los servicios externos estén configurados. Los datos iniciales y las cuentas de demostración del frontend no son registros reales del backend.

## 2. Arquitectura

```text
Navegador
  └── Frontend React + TypeScript (Vite, puerto 3000 en desarrollo)
       ├── Estado de demostración y preferencias en localStorage
       └── Solicitudes JSON con cookies de sesión
            └── Backend Flask (puerto 5000 en desarrollo)
                 └── Flask-SQLAlchemy / SQLAlchemy
                      └── SQLite local predeterminada
                          PostgreSQL o MySQL mediante DATABASE_URL
```

En desarrollo, [vite.config.ts](../vite.config.ts) reenvía `/api` y `/auth` a Flask. En el contenedor de despliegue, [Dockerfile](../Dockerfile) compila el frontend y Gunicorn ejecuta Flask; Flask también sirve los archivos compilados y las rutas de la aplicación.

### Directorios y archivos relevantes

| Ruta | Responsabilidad |
|---|---|
| `src/App.tsx` | Estado de la interfaz, coordinación de solicitudes a la API, vistas y datos de demostración. |
| `src/components/` | Componentes de interfaz, entre ellos autenticación, administración, configuración y catálogo. |
| `src/pages/` | Paneles de comprador y productor. |
| `src/data/` | Datos locales iniciales de municipios y productos. |
| `src/types.ts` | Tipos TypeScript del dominio del frontend. |
| `backend/app.py` | Aplicación Flask, modelos SQLAlchemy, validaciones y rutas HTTP. |
| `backend/database/` | Esquema SQL, diagrama entidad-relación y base de muestra. |
| `backend/tests/` | Pruebas de API y utilidades de prueba. |

## 3. Frontend

El frontend está implementado en React 19 y TypeScript, con Vite, Tailwind CSS y Leaflet/React Leaflet. La navegación se coordina en `src/App.tsx`; los paneles de comprador, productor y administrador se cargan bajo demanda.

Las solicitudes de la API incluyen credenciales de sesión (`credentials: 'include'`). El helper de `App.tsx` convierte respuestas HTTP no exitosas en errores usando el campo JSON `error` cuando está presente.

La interfaz también conserva información local, por ejemplo preferencias y datos de demostración, en `localStorage`. Por ello, no todo dato que aparece en la interfaz necesariamente proviene de la base de datos. El estado de autenticación de una cuenta conectada al backend se valida mediante la sesión Flask.

## 4. Backend, sesión y conexión a base de datos

El backend está en `backend/app.py` y usa Flask con Flask-SQLAlchemy. La configuración lee variables de entorno mediante `python-dotenv`:

- `FLASK_SECRET_KEY` es obligatoria para crear la aplicación.
- `DATABASE_URL` configura la base; su valor predeterminado es `sqlite:///agrocordoba.db`.
- Las variables para OAuth, correo, cookies y el directorio compilado del frontend son opcionales según el uso.

La sesión de usuario se conserva con la sesión firmada de Flask y cookie `HttpOnly`, `SameSite=Lax`; `COOKIE_SECURE` permite exigir `Secure` en HTTPS. La API obtiene la cuenta actual desde `session["user_id"]`.

Las tablas se crean al iniciar mediante `db.create_all()`. El código también incluye funciones de migración para columnas antiguas y datos JSON heredados. No se observa el uso de Alembic/Flask-Migrate en la configuración actual. Para revisar el esquema y el diagrama, consulta `backend/database/schema.sql`, `backend/database/ERD.svg` y `backend/database/ERD.mmd`.

### Modelos de datos

| Modelo / tabla | Propósito y relaciones principales |
|---|---|
| `User` / `user` | Cuenta, identidad de acceso, rol, perfil, datos de productor/comprador y estado. Correo e identificador OAuth tienen índices únicos. |
| `ProducerProduct` / `producer_product` | Productos que declara ofrecer un productor; FK a `user`. Un nombre no se repite por usuario. |
| `AccountSettings` / `account_settings` | Preferencias de notificación de la cuenta; FK única a `user`. |
| `SettingsVerification` / `settings_verification` | Hash del código y cambios de cuenta pendientes; FK única a `user`. |
| `PasswordResetVerification` / `password_reset_verification` | Hash, vencimiento, hora de envío e intentos de recuperación; FK única a `user`. |
| `ProductListing` / `product_listing` | Publicación agrícola, precio, inventario, ubicación y productor propietario; FK a `user`. |
| `ProductCertification` / `product_certification` | Certificaciones de la publicación; FK a `product_listing`, sin nombres repetidos por publicación. |
| `QuotationRecord` / `quotation_record` | Cotización con FK al cliente y al productor. Conserva una instantánea de datos y precios; `product_listing_id` puede quedar nulo al eliminar la publicación. |
| `Favorite` / `favorite` | Producto guardado por un comprador; FK a `user` y restricción única por usuario/producto. |
| `ReadNotification` / `read_notification` | Cotización marcada como leída; FK al usuario y a la cotización, única por usuario/cotización. |

## 5. Rutas HTTP de la API

Las rutas de abajo corresponden a los decoradores presentes en `backend/app.py`. Las rutas protegidas usan la sesión de Flask. Los códigos descritos son los que se generan explícitamente en las validaciones de las rutas; un fallo de infraestructura no debe interpretarse como una respuesta de éxito.

### Autenticación y estado

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /api/auth/register` | Público | Registra comprador o productor. El productor queda pendiente de aprobación. |
| `POST /api/auth/login` | Público | Inicia sesión con correo y contraseña local. |
| `GET /api/auth/me` | Sesión | Devuelve la cuenta de la sesión actual. |
| `POST /api/auth/logout` | Sesión | Limpia la sesión actual. |
| `GET /auth/google` | Público; OAuth configurado | Inicia el flujo OAuth. Si faltan credenciales, redirige con estado de configuración. |
| `GET /auth/google/callback` | Retorno OAuth | Procesa el retorno del proveedor y crea o actualiza la asociación de cuenta. |
| `GET /api/health` | Público | Devuelve el estado HTTP de la aplicación; no es una prueba completa de disponibilidad de servicios externos. |

### Productos

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/products` | Público | Lista publicaciones de productores activos. |
| `POST /api/products` | Productor activo | Crea una publicación propia. |
| `PUT /api/products/<product_id>` | Productor propietario o administrador | Actualiza una publicación. |
| `DELETE /api/products/<product_id>` | Productor propietario o administrador | Elimina una publicación; las cotizaciones conservan su instantánea y se desvinculan de la publicación viva. |
| `POST /api/admin/products` | Administrador | Crea una publicación para un productor activo indicado. |

### Cotizaciones, favoritos y avisos

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/quotations` | Sesión | Comprador ve sus cotizaciones, productor activo las recibidas y administrador la lista completa. |
| `POST /api/quotations` | Comprador | Crea una solicitud de cotización para una publicación real del backend. |
| `PATCH /api/quotations/<quotation_id>` | Productor propietario y activo | Cambia el estado de una cotización. |
| `GET /api/favorites` | Comprador | Consulta sus identificadores de productos favoritos. |
| `PUT /api/favorites` | Comprador | Reemplaza su lista de favoritos. |
| `GET /api/notifications/read` | Comprador | Consulta identificadores de cotizaciones marcadas como leídas. |
| `PUT /api/notifications/read` | Comprador | Marca como leídas cotizaciones propias incluidas en la solicitud. |

### Perfil y administración

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /api/account/settings` | Sesión | Consulta teléfono y preferencias de notificación. |
| `PATCH /api/account/profile` | Sesión | Actualiza campos de perfil permitidos según el rol. |
| `POST /api/account/settings/request-code` | Sesión; correo configurado | Solicita un código para confirmar cambios de cuenta. |
| `POST /api/account/settings/verify-code` | Sesión | Verifica el código y aplica los cambios pendientes. |
| `POST /api/auth/password/request-code` | Público; correo configurado | Solicita un código para recuperar contraseña. |
| `POST /api/auth/password/verify-code` | Público | Verifica el código y cambia la contraseña. |
| `GET /api/admin/users` | Administrador | Lista cuentas no administrativas. |
| `PATCH /api/admin/users/<user_id>/status` | Administrador | Cambia el estado de una cuenta no administrativa. |
| `PATCH /api/admin/users/<user_id>` | Administrador | Edita datos permitidos de comprador o productor. |
| `DELETE /api/admin/users/<user_id>` | Administrador | Elimina una cuenta no administrativa y registros relacionados tratados por la ruta. |

### Rutas de publicación web y SEO

| Método y ruta | Descripción |
|---|---|
| `GET /producto/<slug>/<product_id>` | Sirve el frontend con metadatos y datos estructurados de una publicación activa, cuando existe. |
| `GET /sitemap.xml` | Genera el sitemap de la página inicial y publicaciones activas. |
| `GET /` y `GET /<path>` | Sirven el frontend compilado y sus rutas cliente. |

## 6. Validaciones y reglas de negocio observadas

- **Registro:** normaliza el correo, limita nombre a 160 caracteres, valida formato básico del correo, exige contraseña de al menos 8 caracteres y roles `cliente` o `productor`. Un registro de productor exige finca, asociación y una lista no vacía de productos. Correo duplicado produce `409`.
- **Publicación de productos:** exige categoría de un conjunto permitido, nombre, límites de longitud, valores numéricos válidos, coordenadas dentro de rangos geográficos y precio, inventario mínimo y pedido mínimo mayores que cero. Acepta hasta 20 certificaciones de hasta 100 caracteres cada una.
- **Autorización de publicaciones:** solo productores activos pueden crear o gestionar sus propias publicaciones; el administrador puede gestionar publicaciones y asignarlas a un productor activo.
- **Cotizaciones:** solo compradores pueden crear solicitudes para productos guardados en el backend. Cantidad debe respetar pedido mínimo e inventario; transporte no puede ser negativo y está limitado a 100 millones COP; el destino debe pertenecer a la lista aceptada. La nota se limita a 1000 caracteres. El descuento se calcula según los umbrales implementados en el endpoint.
- **Estados de cotización:** la ruta de productor acepta `Pendiente`, `Cotizado`, `Contactado WhatsApp` y `Cerrado`, y el productor debe ser el propietario.
- **Perfil:** solo permite campos definidos por la ruta; limita longitudes y valida imágenes de datos como JPG, PNG o WebP, hasta 1 MB decodificado. Las URLs de imagen deben usar HTTPS.
- **Códigos de verificación:** tienen vencimiento de 10 minutos, máximo de cinco intentos y las solicitudes tienen espera de 60 segundos antes de solicitar otro código.
- **Favoritos/avisos:** la lista de favoritos está limitada a 500 elementos; las notificaciones se filtran para aceptar solo cotizaciones que pertenecen al comprador.

La interfaz implementa validaciones complementarias, pero la validación del backend es la que protege las operaciones persistidas.

## 7. Manejo de errores

- Los errores de validación y autorización de la API se devuelven normalmente como JSON con una clave `error` y el código HTTP correspondiente (`400`, `401`, `403`, `404`, `409`, `429` o `503`, según la operación).
- El frontend presenta el mensaje del backend cuando está disponible; ante una respuesta HTTP no exitosa, su helper lanza un error para que lo gestione el componente llamador.
- Los errores de entrega de correo para verificación se registran con `app.logger.exception(...)` y se responden con `503`; el envío depende de Resend o SMTP configurado.
- El registro controla conflictos de integridad de base de datos, hace rollback y devuelve conflicto si el correo ya existe; otros errores de integridad se vuelven a lanzar.
- No se observa un manejador global uniforme para todas las excepciones. No debe asumirse que cualquier error inesperado se transforme al mismo JSON.
- Algunas operaciones de interfaz usan `console.error` o notificaciones locales; otras acciones propagan el error para su tratamiento por el panel.

## 8. Pruebas y límites

El backend incluye pruebas en `backend/tests/test_api.py`. El fixture de `backend/tests/conftest.py` configura SQLite en memoria, recrea las tablas para cada prueba y utiliza una clave marcada como exclusiva de pruebas. El repositorio también documenta la ejecución con:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

La existencia de pruebas no demuestra por sí misma que hayan pasado en esta revisión; registra el resultado solo después de ejecutar el comando en el entorno del proyecto.

Aspectos que deben tenerse presentes al presentar el sistema:

- Los productos y algunas cuentas del frontend son datos de demostración/locales; no equivalen a publicaciones reales persistidas.
- Correo y Google OAuth dependen de variables y credenciales externas que no se incluyen en Git.
- No se identificó una pasarela de pagos en la implementación revisada.
- El backend crea tablas y contiene migraciones manuales para compatibilidad; no se identificó un sistema formal de migraciones versionadas.
- La configuración SQLite de un despliegue en almacenamiento efímero no ofrece persistencia garantizada.

## 9. Responsable de revisión pendiente

**Aporte asignado para evidencia de colaboración:** Ayanis Sanabria debe revisar esta documentación frente al código, corregir o ampliar el contenido según su revisión y registrar esos cambios en GitHub desde su propia cuenta. La asignación no significa que la revisión ya se haya realizado ni que esta versión del documento sea de su autoría.
