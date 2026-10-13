# AgroCórdoba

Plataforma que conecta a compradores con productores campesinos de Córdoba, Colombia. El proyecto busca dar visibilidad a las cosechas y promover el trabajo decente y el crecimiento económico (ODS 8).

## Tecnologías

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS 4, Leaflet y React Leaflet.
- Backend: Python 3.13, Flask, Flask-SQLAlchemy y SQLAlchemy.
- Base de datos: SQLite local; SQLAlchemy también admite PostgreSQL y MySQL mediante `DATABASE_URL`. El servicio público de Render usa actualmente SQLite en el sistema de archivos efímero de su plan gratuito.
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
- Panel administrador conectado para revisar usuarios, aprobar, editar o eliminar cuentas, consultar cotizaciones y gestionar publicaciones. La cuenta puede crearse localmente con `flask --app app create-admin` o al iniciar el backend con `ADMIN_EMAIL` y `ADMIN_PASSWORD` configuradas como secretos.
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

## Despliegue actual y producción

El sitio está publicado en Render desde la rama `main`. El `Dockerfile` compila el frontend y ejecuta Flask con Gunicorn en el mismo origen. La configuración actual usa el plan gratuito y SQLite en almacenamiento efímero; los datos pueden perderse al reiniciar o volver a desplegar el servicio.

Para una instalación de producción con datos persistentes:

1. Configura una base de datos persistente permitida por el proyecto y define su URL en `DATABASE_URL`.
2. Configura `FLASK_SECRET_KEY` como secreto y `COOKIE_SECURE=true`.
3. Para crear un administrador al arrancar, configura juntas `ADMIN_EMAIL` y `ADMIN_PASSWORD` como secretos del servicio. La contraseña debe tener al menos 12 caracteres. El backend crea la cuenta solo si no existe; no cambia la clave de una cuenta existente.
4. Para Google, registra `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y el callback HTTPS `/auth/google/callback` en Google Cloud.
5. Para correos desde un alojamiento que bloquee SMTP, configura `RESEND_API_KEY` y un remitente verificado en `RESEND_FROM`. En local también se admite SMTP.
6. Migra los datos de `backend/instance/agrocordoba.db` antes de habilitar cuentas existentes. El despliegue no copia automáticamente la base local.

Render ofrece servicios gratis con limitaciones y su sistema de archivos es efímero. En Render, los discos persistentes requieren un plan compatible de pago; no actualices sin revisar antes el costo. Nunca subas `backend/.env`, contraseñas, claves OAuth, credenciales de correo, la base local ni archivos `.venv` al repositorio.

## SEO de productos

Las publicaciones reales de productores activos se sirven con metadatos y JSON-LD `Product` en el HTML inicial de sus rutas `/producto/<slug>/<id>`. El sitemap XML incluye esas publicaciones y se actualiza desde la base de datos. Los productos de muestra del frontend no se incluyen como ofertas reales.
