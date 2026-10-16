# AgroCórdoba

## ODS abordado

**ODS 8: Trabajo decente y crecimiento económico.** AgroCórdoba busca contribuir a la visibilidad comercial de productores campesinos de Córdoba, Colombia.

## Descripción de la solución

AgroCórdoba es una plataforma web que conecta a compradores con productores campesinos del departamento de Córdoba. Permite explorar productos agrícolas y municipios, y ofrece flujos de registro, publicaciones de cosechas y solicitudes de cotización. Las cuentas reales y las funciones conectadas guardan sus datos en el backend; el proyecto también incluye productos y accesos de demostración locales, que no representan ventas ni usuarios reales.

La plataforma no procesa pagos. Los datos de demostración no representan usuarios ni ventas reales. El backend dispone de rutas para cuentas, cosechas y cotizaciones, pero la disponibilidad de funciones depende de la configuración del despliegue.

## Estado actual del proyecto

El sitio está publicado y permite revisar la interfaz y el catálogo de demostración. Esto no significa que todas las funciones de producción estén configuradas:

| Elemento | Estado |
|---|---|
| Sitio web y contenido visual | Publicados en Render. |
| Backend y rutas de la aplicación | Incluidos en el proyecto. |
| Base de datos del despliegue | SQLite en almacenamiento efímero de Render; los registros pueden perderse al reiniciar o desplegar. No usar para conservar datos reales. |
| Inicio de sesión con Google | El código está incluido, pero faltan las credenciales y la configuración de Google Cloud. |
| Recuperación de contraseña por correo | El código está incluido, pero falta configurar y probar un proveedor de correo y un remitente válido. |
| Persistencia de cuentas, publicaciones y cotizaciones | Pendiente configurar y verificar una base de datos persistente. |

Por tanto, el despliegue sirve como demostración del proyecto, pero no se debe presentar como un servicio con cuentas persistentes, inicio de Google o recuperación por correo ya operativos.

## Integrantes

- Wilmer Caraballo
- Ayanis Sanabria

## Tecnologías utilizadas

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Leaflet y React Leaflet.
- **Backend:** Python 3.13, Flask, Flask-SQLAlchemy y SQLAlchemy.
- **Base de datos:** SQLite por defecto en desarrollo; el backend también admite PostgreSQL y MySQL mediante `DATABASE_URL`.
- **Autenticación:** sesiones Flask con correo y contraseña; Google OAuth opcional.

## Requisitos

- Node.js 20 o superior.
- Python 3.13.
- npm.

## Instalación y ejecución local en Windows

Clona o descarga el proyecto y abre PowerShell en su carpeta raíz. Instala las dependencias del frontend:

```powershell
npm install
```

En una segunda terminal de PowerShell, prepara el backend:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edita `backend/.env` y asigna un valor privado a `FLASK_SECRET_KEY`. Puedes generar uno desde PowerShell con:

```powershell
py -c "import secrets; print(secrets.token_hex(32))"
```

Inicia el backend desde la carpeta `backend`:

```powershell
flask --app app run --debug --port 5000
```

En la terminal de la raíz del proyecto, inicia el frontend:

```powershell
npm run dev
```

Abre <http://localhost:3000>. El servidor de desarrollo de Vite reenvía las solicitudes `/api` y `/auth` al backend en `http://localhost:5000`. La base SQLite local se crea en `backend/instance/` cuando inicia el backend.

## Variables de entorno

El archivo de referencia es [`backend/.env.example`](backend/.env.example). Cópialo como `backend/.env` para desarrollo local. **No publiques el archivo `.env` ni agregues credenciales reales al repositorio.**

| Variable | Uso |
|---|---|
| `FLASK_SECRET_KEY` | **Obligatoria.** Clave privada para las sesiones Flask. |
| `DATABASE_URL` | URL de conexión; si se omite, el backend usa SQLite local (`sqlite:///agrocordoba.db`). |
| `COOKIE_SECURE` | Activa cookies seguras en HTTPS (`false` en el ejemplo local). |
| `FLASK_DEBUG` | Controla el modo de depuración de la ejecución local. |
| `FRONTEND_URL` | URL del frontend para redirecciones; su valor predeterminado es `http://localhost:3000/`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Opcionales; necesarios para configurar Google OAuth. |
| `RESEND_API_KEY`, `RESEND_FROM` | Opcionales; configuración de envío de correo mediante Resend. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_USE_TLS`, `SMTP_USE_SSL` | Opcionales; configuración alternativa de correo SMTP. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Opcionales; si se configuran juntas en el entorno del servicio, permiten crear una cuenta administradora al iniciar. No son necesarias para ejecutar localmente la aplicación básica. |
| `FRONTEND_DIST_DIR` | Opcional; ruta de los archivos compilados del frontend en despliegues. |

Google OAuth y el correo de recuperación o confirmación dependen de credenciales válidas de los respectivos proveedores. No se incluyen claves, contraseñas ni tokens en este repositorio.

## Despliegue

- **Repositorio:** [https://github.com/montalvow631/agrocordoba](https://github.com/montalvow631/agrocordoba)
- **Sitio publicado:** [https://agrocordoba.onrender.com/](https://agrocordoba.onrender.com/)

El despliegue actual utiliza SQLite en almacenamiento efímero; los datos pueden perderse al reiniciar o volver a desplegar. No debe considerarse almacenamiento persistente para datos reales. Google OAuth y el envío de correos no están configurados en el despliegue actual.

## Base de datos de ejemplo

El proyecto incluye un esquema SQL, un diagrama entidad-relación y una base SQLite de muestra con registros ficticios en [`backend/database/`](backend/database/). La base de muestra no es un respaldo de producción ni contiene usuarios con contraseñas válidas.

Para consultar la documentación del backend, las rutas y las instrucciones adicionales, revisa [`backend/README.md`](backend/README.md).

## Documentación de Momento 2

El informe de trabajo en formato Word reúne la comparación con Momento 1, la documentación técnica, el manual de instalación, la lista de verificación y las imágenes de referencia compartidas: [`docs/Informe_AgroCordoba_Momento_2.docx`](docs/Informe_AgroCordoba_Momento_2.docx).

El documento señala los elementos pendientes de validar o completar. No es una certificación de que todas las funciones o requisitos estén terminados.
