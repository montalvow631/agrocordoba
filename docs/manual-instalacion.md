# Manual de instalación y ejecución local

Este manual describe cómo ejecutar AgroCórdoba en Windows desde una copia limpia del repositorio. Los pasos inician el frontend y el backend en procesos separados.

## Requisitos

- Windows 10 u 11.
- Node.js 20 o superior y npm.
- Python 3.13 disponible mediante el lanzador `py`.
- Git, si se va a clonar el repositorio.

## 1. Obtener el proyecto

Clona el repositorio y abre PowerShell en la carpeta raíz:

```powershell
git clone https://github.com/montalvow631/agrocordoba.git
cd agrocordoba
```

Si ya tienes una copia local, abre PowerShell en esa carpeta.

## 2. Instalar dependencias del frontend

Desde la raíz del proyecto:

```powershell
npm install
```

## 3. Preparar el backend

Abre una segunda terminal de PowerShell y ejecuta:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Si PowerShell bloquea la activación del entorno virtual, permite scripts solo en la terminal actual y vuelve a activarlo:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

No es necesario cambiar la política de ejecución de forma permanente.

## 4. Configurar el entorno local

Edita `backend/.env` y asigna un secreto privado a `FLASK_SECRET_KEY`. Puedes generar uno sin instalar paquetes adicionales:

```powershell
py -c "import secrets; print(secrets.token_hex(32))"
```

Copia el resultado en `FLASK_SECRET_KEY` dentro de `backend/.env`. No compartas ni publiques ese valor. La aplicación usa SQLite local si `DATABASE_URL` no está definida. Google OAuth y el envío de correo son opcionales y requieren credenciales de sus proveedores; no son necesarios para arrancar el flujo local básico.

Consulta [`backend/.env.example`](../backend/.env.example) para conocer los nombres de las variables disponibles. No sobrescribas un `.env` que ya exista.

## 5. Iniciar el backend

Desde la terminal que está en `backend` y tiene activo `.venv`:

```powershell
flask --app app run --debug --port 5000
```

Deja esa terminal abierta. El backend queda disponible en `http://localhost:5000`. Al iniciar, el código crea las tablas necesarias si no existen. La base SQLite local pertenece al entorno de desarrollo y no debe confundirse con la base de muestra o con un respaldo de producción.

## 6. Iniciar el frontend

En una terminal situada en la raíz del repositorio:

```powershell
npm run dev
```

Deja abierta esa terminal y visita <http://localhost:3000>. Vite reenvía las solicitudes `/api` y `/auth` al backend local del puerto 5000.

## 7. Detener los servicios

En cada terminal, presiona `Ctrl+C`. Para salir del entorno virtual de Python, ejecuta `deactivate`.

## Problemas comunes

- **`py -3.13` no encuentra Python:** instala Python 3.13 y verifica que el lanzador de Windows lo reconozca.
- **Error por `FLASK_SECRET_KEY`:** confirma que `backend/.env` existe y que contiene un valor local privado en esa variable.
- **No responde `/api`:** verifica que Flask siga ejecutándose en el puerto 5000 y Vite en el puerto 3000.
- **Puerto ocupado:** cierra el proceso que ya lo usa o cambia el puerto y actualiza también la configuración del proxy en `vite.config.ts`.
- **Google o correo no están disponibles:** esos servicios requieren credenciales válidas y configuración externa. El arranque local básico no los configura automáticamente.
- **No aparecen publicaciones persistidas:** los productos de referencia del frontend son datos de demostración; las publicaciones creadas en el backend se consultan desde `/api/products`.

## Ejecución de pruebas del backend

Con el entorno virtual activado, desde `backend`:

```powershell
python -m pytest -q -p no:cacheprovider
```

Este comando indica cómo ejecutar las pruebas; no constituye por sí mismo evidencia de que se hayan ejecutado o aprobado.
