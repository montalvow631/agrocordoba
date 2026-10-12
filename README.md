# AgroCórdoba

Plataforma que conecta a compradores con productores campesinos de Córdoba, Colombia. El proyecto busca dar visibilidad a las cosechas y promover el trabajo decente y el crecimiento económico (ODS 8).

## Tecnologías

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS 4, Leaflet y React Leaflet.
- Backend: Python 3.13, Flask, Flask-SQLAlchemy y SQLAlchemy.
- Base de datos local: SQLite. Producción: PostgreSQL mediante `DATABASE_URL`.
- Autenticación: correo y contraseña con sesiones Flask; Google OAuth es opcional.

## Ejecutar en Windows

Instala Node.js 20 o superior. En una terminal desde la raíz:

```powershell
npm install
npm run dev
```

En otra terminal:

```powershell
cd backend
if (-not (Test-Path .venv)) { py -3.13 -m venv .venv }
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
flask --app app run --debug --port 5000
```

Completa `FLASK_SECRET_KEY` en `backend/.env` antes de iniciar Flask. El frontend queda en `http://localhost:3000`; Vite envía `/api` y `/auth` al backend en `http://localhost:5000`.

## Funciones conectadas a Flask

- Registro e inicio de sesión con contraseña; los productores quedan pendientes hasta la aprobación del administrador.
- Publicaciones de productores, edición y eliminación propias; solicitudes de cotización con estado administrado por el productor.
- Panel administrador conectado para revisar usuarios, aprobar, editar o eliminar cuentas, consultar cotizaciones y gestionar publicaciones.
- Perfil, favoritos y avisos leídos asociados a la cuenta.
- Google OAuth y códigos de recuperación/confirmación por correo dependen de credenciales externas configuradas en variables de entorno.

Los accesos de demostración, productos de referencia y algunos datos de analítica siguen siendo locales o de muestra. No representan ventas reales. Las fotos subidas se guardan en la base de datos del usuario autenticado.

## Verificaciones

```powershell
npm run lint
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

## Preparación para publicar (todavía no desplegada)

El `Dockerfile` compila el frontend y ejecuta Flask con Gunicorn en el mismo origen. Para Render, conecta el repositorio de GitHub y crea un servicio Docker con el contexto y Dockerfile en la raíz del repositorio. Antes de desplegar:

1. Configura una base PostgreSQL persistente en `DATABASE_URL`. No uses el SQLite local en un servicio alojado con disco efímero.
2. Configura `FLASK_SECRET_KEY` con un valor secreto, `COOKIE_SECURE=true` y `FRONTEND_URL` con la URL HTTPS del servicio.
3. Para Google, registra `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y el callback HTTPS `/auth/google/callback` en Google Cloud.
4. Para correos desde un alojamiento que bloquee SMTP, configura `RESEND_API_KEY` y un remitente verificado en `RESEND_FROM`. En local también se admite SMTP.
5. Crea la cuenta administradora conectando temporalmente la CLI a la base alojada y ejecutando `flask --app app create-admin` desde `backend`.
6. Migra los datos de `backend/instance/agrocordoba.db` antes de habilitar cuentas existentes. El despliegue no copia automáticamente la base local.

Render ofrece servicios gratis con limitaciones: los servicios web se suspenden tras inactividad y su sistema de archivos es efímero. La base PostgreSQL gratuita de Render expira; revisa sus condiciones actuales y no la uses como almacenamiento permanente de cuentas reales. Esta configuración está preparada, pero no se ha publicado ningún servicio.

Nunca subas `backend/.env`, contraseñas, claves OAuth, credenciales de correo, la base local ni archivos `.venv` al repositorio.
