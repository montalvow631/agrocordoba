# Backend de AgroCórdoba

API Flask con SQLAlchemy. En desarrollo usa SQLite en `backend/instance/agrocordoba.db`; para alojar el proyecto debe recibir una URL PostgreSQL persistente en `DATABASE_URL`.

## Preparación local en Windows

Desde `backend`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
py -c "import secrets; print(secrets.token_hex(32))"
```

Copia el valor generado a `FLASK_SECRET_KEY` en `.env`. Inicia la API:

```powershell
flask --app app run --debug --port 5000
```

En una segunda terminal, desde la raíz, ejecuta `npm run dev`.

## Rutas principales

- Sesión: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Contraseña: `POST /api/auth/password/request-code` y `POST /api/auth/password/verify-code`.
- Perfil y configuración: `GET /api/account/settings`, `PATCH /api/account/profile`, `POST /api/account/settings/request-code`, `POST /api/account/settings/verify-code`.
- Cosechas: `GET /api/products`, `POST /api/products`, `PUT /api/products/<id>`, `DELETE /api/products/<id>`.
- Cotizaciones: `GET /api/quotations`, `POST /api/quotations`, `PATCH /api/quotations/<id>`.
- Favoritos de compradores: `GET /api/favorites`, `PUT /api/favorites`.
- Avisos leídos de compradores: `GET /api/notifications/read`, `PUT /api/notifications/read`.
- Administración: `GET /api/admin/users`, `PATCH /api/admin/users/<id>`, `PATCH /api/admin/users/<id>/status`, `DELETE /api/admin/users/<id>`, `POST /api/admin/products`.
- Estado: `GET /api/health`.
- SEO: `GET /producto/<slug>/<id>` entrega metadatos y JSON-LD iniciales para publicaciones reales activas; `GET /sitemap.xml` lista la página principal y las publicaciones activas.

Las operaciones administrativas exigen sesión con rol `admin`. El administrador puede aprobar, editar o eliminar cuentas; eliminar una cuenta también elimina sus cotizaciones, publicaciones y preferencias asociadas. Las publicaciones nuevas se asignan a un productor aprobado. Los productores solo pueden editar sus propios productos y gestionar sus cotizaciones.

## Crear administrador real

Desde `backend`, ejecuta:

```powershell
flask --app app create-admin
```

El comando solicita correo y contraseña (mínimo 12 caracteres). No guardes esa contraseña en archivos del proyecto. En una base remota, ejecuta el comando con el `DATABASE_URL` de esa base configurado localmente y conserva las credenciales fuera de Git.

En despliegues sin consola disponible, configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` como variables secretas del servicio. Deben configurarse juntas y la contraseña debe tener al menos 12 caracteres. Al iniciar, se crea una cuenta administradora solo si ese correo no existe; no se modifica la contraseña de cuentas existentes. No guardes esos valores en el repositorio.

## Correo de recuperación y confirmación

En local puedes configurar SMTP en `.env` con una contraseña de aplicación. Para un alojamiento que limite SMTP, la API admite Resend mediante HTTPS:

```env
RESEND_API_KEY=tu_clave_secreta
RESEND_FROM=AgroCórdoba <cuenta@tu-dominio-verificado.com>
```

El dominio remitente debe estar verificado en el proveedor. No compartas ni subas estas claves. Si no se configura proveedor, recuperación de contraseña y confirmación por correo responderán que el envío no está disponible.

Para habilitar recuperación de contraseñas en Render, configura `RESEND_API_KEY` y `RESEND_FROM` en las variables privadas del servicio. Por ejemplo, el remitente puede tener la forma `AgroCórdoba <no-reply@tu-dominio.com>`, pero el dominio debe estar verificado en Resend. El backend envía el correo por HTTPS. No uses una clave de ejemplo ni publiques la clave real.

## Google OAuth

El código OAuth ya está integrado, pero necesita un cliente OAuth de Google:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`

En Google Cloud configura la pantalla de consentimiento y crea un cliente OAuth de tipo aplicación web. Registra `https://agrocordoba.onrender.com` como origen autorizado y `https://agrocordoba.onrender.com/auth/google/callback` como URI de redireccionamiento autorizada. Si la aplicación está en modo de prueba, añade los correos permitidos como usuarios de prueba.

En Render configura las cuatro variables anteriores como variables del servicio. Si no se especifica `FRONTEND_URL` ni `GOOGLE_REDIRECT_URI`, el backend usa `RENDER_EXTERNAL_URL` para volver al servicio desplegado; en local conserva los valores de localhost. La URI configurada en Google Cloud debe coincidir exactamente con `GOOGLE_REDIRECT_URI`. No guardes credenciales OAuth en el frontend, en Git ni en archivos compartidos.

Google inicia sesión con el correo verificado. Si ese correo ya existe en la base activa, la cuenta se asocia al identificador de Google; si no existe, se crea una cuenta nueva de cliente. Para conservar el rol administrador al cambiar a una base vacía, crea primero la cuenta administradora en PostgreSQL con `ADMIN_EMAIL` y `ADMIN_PASSWORD` usando el correo que usarás con Google, y luego inicia sesión con ese mismo correo.

## Base de datos y despliegue

`db.create_all()` crea las tablas nuevas al iniciar y el backend mantiene una migración sencilla de columnas de usuario heredadas. Para cambios futuros del esquema, conviene adoptar Alembic/Flask-Migrate antes de crecer. El proyecto incluye `Dockerfile` de raíz: construye Vite y sirve frontend y API desde Flask/Gunicorn en el mismo origen.

Para conservar las cuentas entre reinicios, crea una base PostgreSQL en Render y configura `DATABASE_URL` del servicio web con la **Internal Database URL** de esa base. El backend ya incluye el controlador PostgreSQL. Mantén PostgreSQL y el servicio web en la misma región para usar la URL interna.

La base SQLite anterior no se copia automáticamente a PostgreSQL. Si contiene usuarios reales además de la cuenta administradora que se va a recrear, respalda y migra esos datos antes de cambiar `DATABASE_URL`. Para una base nueva, configura también `ADMIN_EMAIL` y `ADMIN_PASSWORD` en Render; la contraseña debe tener al menos 12 caracteres y ambas variables deben configurarse juntas. El backend crea esa cuenta administradora solo si el correo aún no existe.

Configura al desplegar:

- `DATABASE_URL`: PostgreSQL persistente; la base SQLite local no se transfiere sola.
- `FLASK_SECRET_KEY`: secreto aleatorio y privado.
- `COOKIE_SECURE=true` y `FRONTEND_URL=https://.../`.
- Credenciales OAuth y correo, solo si se van a activar.

El servicio público actual de Render usa SQLite en su sistema de archivos efímero; cuentas, publicaciones y cotizaciones pueden perderse al reiniciar o desplegar. Los servicios gratuitos pueden suspenderse y borrar archivos locales. No uses ese servicio para conservar datos reales importantes; configura almacenamiento persistente antes de depender de él.

## Archivos para la entrega de base de datos

En [`database`](database/) están el esquema SQLite (`schema.sql`), el diagrama entidad-relación (`ERD.svg` y `ERD.mmd`) y una copia de muestra (`agrocordoba_sample.db`) con datos sintéticos. Productos, certificaciones y productos asociados a productores están normalizados en tablas relacionadas; los cambios pendientes de configuración y las cotizaciones usan columnas tipadas. La cotización conserva una instantánea histórica. Para crear una copia nueva, desde `backend` ejecuta:

```powershell
.\.venv\Scripts\python.exe database\create_sample_database.py
```

El generador no sobrescribe un archivo existente. La copia de muestra no proviene de Render y sus usuarios no tienen contraseñas de acceso. No reemplaza un respaldo de producción. Al iniciar, el backend migra automáticamente los campos JSON antiguos a las tablas/columnas normalizadas. Antes de migrar una base de datos con datos importantes, conserva una copia de respaldo.

## Pruebas

Las pruebas usan SQLite en memoria y una clave exclusiva de prueba. Desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```
