# Estructura propuesta para el informe final en PDF

> **Plantilla de trabajo:** completar los campos entre corchetes y adjuntar evidencia antes de exportar. Este documento no es el informe final y no afirma que el proyecto esté terminado.

## Portada

- **Universidad:** Universidad Cooperativa de Colombia
- **Actividad:** Actividad Evaluativa Momento 2 – Desarrollo Sostenible
- **Proyecto:** AgroCórdoba
- **ODS abordado:** ODS 8 – Trabajo decente y crecimiento económico
- **Integrantes:** Wilmer Caraballo y Ayanis Sanabria
- **Curso / asignatura:** [completar]
- **Docente:** [completar]
- **Sede y fecha:** [completar]

## Tabla de contenido

Generar automáticamente en el editor que se use para producir el PDF, después de aplicar los estilos de encabezado. La paginación se completa al final.

## 1. Resumen del proyecto

Explicar brevemente la finalidad de AgroCórdoba, sus usuarios previstos y el alcance actual. Diferenciar las funciones conectadas al backend de los datos y accesos demostrativos. No afirmar que el sistema está completo si existen dependencias externas o funcionalidades pendientes.

## 2. Problemática y contexto

- Describir la necesidad que el equipo identificó respecto a la visibilidad comercial de productores campesinos de Córdoba.
- Incluir la fuente o evidencia que sustenta el problema: [completar con fuente verificable, fecha y referencia].
- Delimitar población, territorio y alcance del proyecto: [completar con información validada por el equipo].

## 3. Solución propuesta

Describir las funciones verificadas en la versión entregada: exploración de productos y municipios, registro e inicio de sesión, publicaciones y solicitudes de cotización. Señalar que el sistema no procesa pagos y que existen datos de muestra locales.

### 3.1 Estado funcional

| Área | Estado verificado | Evidencia que se adjunta |
|---|---|---|
| Catálogo y datos de referencia | [completar: demo/local/backend] | [captura o prueba] |
| Registro e inicio de sesión | [completar tras verificar] | [captura o caso de prueba] |
| Publicaciones de productor | [completar tras verificar] | [captura o caso de prueba] |
| Solicitud y gestión de cotizaciones | [completar tras verificar] | [captura o caso de prueba] |
| Administración y servicios externos | [indicar configurado, incompleto o pendiente] | [captura o evidencia] |

## 4. Relación con el ODS

- Presentar el **ODS 8: Trabajo decente y crecimiento económico**.
- Explicar la relación prevista entre visibilizar ofertas agrícolas y la meta del proyecto.
- Distinguir el impacto esperado de resultados medidos. No atribuir aumentos de ventas, empleo o ingresos sin datos verificables.
- [Agregar la meta específica del ODS que el equipo haya seleccionado y una fuente oficial.]

## 5. Tecnologías y arquitectura

Resumir el frontend React/TypeScript/Vite, el backend Flask/SQLAlchemy y la persistencia SQLite local, con soporte configurado mediante `DATABASE_URL` para PostgreSQL y MySQL. Incluir un diagrama de arquitectura si el equipo prepara uno.

Referencia: [`docs/documentacion-tecnica.md`](documentacion-tecnica.md).

## 6. Base de datos

- Explicar las entidades y relaciones reales según el esquema.
- Insertar el diagrama entidad-relación.
- Referenciar el esquema SQL.
- Describir la base SQLite de muestra y aclarar que contiene datos sintéticos, no es respaldo de producción y no contiene usuarios con contraseñas de acceso.
- [Adjuntar imagen legible del diagrama y evidencia de apertura/consulta de la base de muestra.]

Archivos del repositorio: `backend/database/schema.sql`, `backend/database/ERD.svg`, `backend/database/ERD.mmd` y `backend/database/agrocordoba_sample.db`.

## 7. Instalación y ejecución

Resumir los requisitos y el procedimiento local para Windows. Referenciar el [`manual de instalación`](manual-instalacion.md) para los comandos completos. No insertar valores secretos ni capturas que los expongan.

## 8. Capturas de pantalla

Insertar capturas propias, recientes y legibles del sistema en funcionamiento. Para cada imagen, incluir título, fecha aproximada, explicación y estado de la función representada.

1. Página principal: [pendiente de captura].
2. Catálogo o filtro por municipio: [pendiente de captura].
3. Flujo de registro/inicio de sesión: [pendiente de captura; ocultar datos personales].
4. Vista de productor y publicación: [pendiente de captura].
5. Flujo de cotización: [pendiente de captura].
6. Evidencia de base de datos o diagrama: [pendiente de captura].

No usar estas etiquetas como si fueran capturas existentes; reemplazarlas por evidencias reales o eliminar las funciones no demostradas.

## 9. Enlaces

- Repositorio: <https://github.com/montalvow631/agrocordoba>
- Despliegue: <https://agrocordoba.onrender.com/>
- Evidencia de historial: [enlace a commits/PRs relacionados]
- Otras referencias consultadas: [completar]

## 10. Cambios frente al Momento 1

No se encontró el informe ni la entrega del Momento 1 en los archivos revisados. Completar esta sección cuando el equipo aporte esa versión:

| Aspecto | Momento 1 (evidencia/fuente) | Momento 2 (estado y evidencia) | Cambio y justificación |
|---|---|---|---|
| Problema y alcance | [pendiente: documento Momento 1] | [completar] | [completar] |
| Diseño/interfaz | [pendiente] | [completar] | [completar] |
| Arquitectura y datos | [pendiente] | [completar] | [completar] |
| Funcionalidades | [pendiente] | [completar] | [completar] |
| ODS e impacto esperado | [pendiente] | [completar] | [completar] |

No inferir diferencias sin comparar con una copia verificable del Momento 1.

## 11. Pruebas, limitaciones y trabajo pendiente

Registrar comandos ejecutados, fecha, resultado real y alcance de las pruebas. Listar configuraciones externas faltantes, funciones demostrativas, limitaciones de persistencia y tareas pendientes. No incluir resultados no observados.

## 12. Participación del equipo

Resumir aportes comprobables de cada integrante y referenciar commits, Pull Requests u otras evidencias. Para Ayanis, completar después de que revise o modifique documentación/código y publique su contribución desde su cuenta. No atribuir retrospectivamente commits existentes.

## 13. Conclusiones y referencias

Presentar conclusiones proporcionales a la evidencia disponible y listar fuentes del problema, ODS, tecnologías y datos usados, con sus enlaces y fecha de consulta.

## Revisión antes de exportar a PDF

- Completar todos los campos entre corchetes o eliminarlos.
- Verificar enlaces y paginación.
- Incluir capturas reales y revisar que no revelen secretos ni datos personales.
- Contrastar afirmaciones con el código y el estado del despliegue.
- Comparar con el Momento 1 únicamente cuando se tenga la entrega previa.
- Exportar a PDF y abrir el archivo para verificar legibilidad e integridad.
