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

## Google OAuth

El código OAuth ya está integrado, pero necesita un cliente OAuth de Google:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`

En local el callback es `http://localhost:5000/auth/google/callback`. En producción debe ser la URL HTTPS real del servicio con `/auth/google/callback`, y debe coincidir exactamente con la URL registrada en Google Cloud. No guardes credenciales OAuth en el frontend.

## Base de datos y despliegue

`db.create_all()` crea las tablas nuevas al iniciar y el backend mantiene una migración sencilla de columnas de usuario heredadas. Para cambios futuros del esquema, conviene adoptar Alembic/Flask-Migrate antes de crecer. El proyecto incluye `Dockerfile` de raíz: construye Vite y sirve frontend y API desde Flask/Gunicorn en el mismo origen.

Configura al desplegar:

- `DATABASE_URL`: PostgreSQL persistente; la base SQLite local no se transfiere sola.
- `FLASK_SECRET_KEY`: secreto aleatorio y privado.
- `COOKIE_SECURE=true` y `FRONTEND_URL=https://.../`.
- Credenciales OAuth y correo, solo si se van a activar.

El servicio público actual de Render usa SQLite en su sistema de archivos efímero; cuentas, publicaciones y cotizaciones pueden perderse al reiniciar o desplegar. Los servicios gratuitos pueden suspenderse y borrar archivos locales. No uses ese servicio para conservar datos reales importantes; configura almacenamiento persistente antes de depender de él.

## Pruebas

Las pruebas usan SQLite en memoria y una clave exclusiva de prueba. Desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```
