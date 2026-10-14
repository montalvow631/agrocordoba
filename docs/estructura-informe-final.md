# Estructura propuesta para el informe final en PDF

> **Plantilla de trabajo:** completar los campos entre corchetes y adjuntar evidencia antes de exportar. Este documento no es el informe final y no afirma que el proyecto esté terminado.

## Portada

- **Universidad:** Universidad Cooperativa de Colombia
- **Facultad:** Ingeniería
- **Campus:** Montería
- **Actividad:** Actividad Evaluativa Momento 2 – Desarrollo Sostenible
- **Proyecto:** AgroCórdoba
- **ODS abordado:** ODS 8 – Trabajo decente y crecimiento económico
- **Integrantes:** Wilmer Caraballo Montalvo y Ayanis Sanabria Perea
- **Curso / asignatura:** Desarrollo Sostenible
- **Docente:** Mauricio Antonio Ricardo Padilla
- **Lugar y año:** Montería, Córdoba — 2026

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

La comparación se basa en las imágenes compartidas del documento del Momento 1. Ese documento presenta la propuesta **“AgroConecta ODS 8: Arquitectura de software y plataforma web modular para la visibilización y comercialización directa de la producción campesina en Colombia”**. En el Momento 2 el proyecto aparece como **AgroCórdoba**. Las imágenes del Momento 1 muestran planteamiento del problema, justificación, objetivos, solución propuesta y diagramas conceptuales de arquitectura, flujo de datos y componentes.

| Aspecto | Momento 1 (evidencia/fuente) | Momento 2 (estado y evidencia) | Cambio y justificación |
|---|---|---|---|
| Problema y alcance | Se plantea reducir intermediación, asimetrías de información y falta de canales directos para pequeños productores; el alcance se formula para Colombia. El documento afirma que intermediarios capturan entre 50 % y 70 % del precio final, pero las páginas compartidas no muestran la fuente de ese dato. | La aplicación se centra en conectar compradores con productores de Córdoba mediante catálogo, perfiles/publicaciones y solicitudes de cotización. | Se concreta el territorio y se implementa un flujo de visibilidad y contacto/cotización. Si se conserva el porcentaje 50–70 % en el informe, agregar una fuente verificable; de lo contrario, presentarlo como afirmación de la propuesta inicial, no como dato comprobado. |
| Nombre e identidad | La propuesta se denomina “AgroConecta ODS 8”. | El producto y repositorio actuales se llaman AgroCórdoba. | Hay un cambio de nombre entre propuesta y producto. El equipo debe confirmar y explicar el motivo real del cambio; no está documentado en la evidencia compartida. |
| Tecnologías y arquitectura | Los diagramas son conceptuales: mencionan cliente web/móvil, servicios y despliegue tipo AWS; el diagrama isométrico muestra Node.js/FastAPI, PostgreSQL, SQLite y S3; el diagrama de componentes menciona PostgreSQL, almacenamiento S3 y una pasarela Wompi/PSE. | El código actual usa React, TypeScript y Vite en frontend; Flask y SQLAlchemy en backend; SQLite por defecto y configuración por `DATABASE_URL` para PostgreSQL/MySQL. No se documenta una integración activa con AWS/S3 o Wompi/PSE en el código revisado. | La arquitectura implementada difiere de los diagramas propuestos. Explicar el motivo técnico o de alcance según la decisión real del equipo. No describir los diagramas iniciales como arquitectura desplegada. |
| Funciones agrícolas | Se propone catálogo geolocalizado, publicación de cosechas y un módulo de inventario/fecha estimada de recolección. | Existe catálogo y publicación de productos con ubicación, existencias, pedido mínimo, temporada de cosecha y embalaje. | Parte de la propuesta se refleja en fichas y publicaciones. No afirmar que exista planificación de ciclos agrícolas o gestión avanzada de inventario; la evidencia de código revisada muestra campos y operaciones de publicaciones. |
| Compra y pagos | Se propone compra directa y una pasarela para pagos móviles/transferencias mediante Wompi/PSE. | Se implementan solicitudes de cotización y gestión de estados. La aplicación informa que no procesa pagos y que comprador y productor acuerdan directamente el precio final, entrega y forma de pago. | El flujo real es de contacto/cotización, no de compra pagada dentro de la plataforma. La pasarela del Momento 1 debe presentarse como propuesta que no forma parte de la implementación actual. La razón de esta decisión debe completarla el equipo. |
| Trazabilidad, formalización e informes | Se proponen trazabilidad, soportes de venta, formalización, reportes financieros e informes de impacto ODS 8. | No se verificaron módulos de trazabilidad, generación de soportes de venta o reportes financieros/ODS en el código revisado. | Estas funciones quedan como propuestas no verificadas/pendientes frente al alcance implementado. No atribuir impacto económico medido sin datos. |
| ODS | La fundamentación relaciona la propuesta con metas 8.2, 8.3 y 8.8 y con modernización/productividad, formalización y derechos laborales. | El proyecto mantiene ODS 8 como marco y plantea visibilizar ofertas campesinas; no se aportaron mediciones de ventas, empleo, ingresos o condiciones laborales. | La relación se mantiene como propósito esperado. Las metas específicas y afirmaciones de la propuesta deben validarse con fuente oficial y separarse de resultados efectivamente medidos. |

### Texto base para documentar la evolución

> En el Momento 1 se formuló AgroConecta ODS 8 como una plataforma modular de comercio directo campesino. La propuesta contemplaba catálogo geolocalizado, publicación de cosechas, compra directa con pagos digitales, trazabilidad, formalización y reportes, y se representó mediante diagramas conceptuales que mencionaban tecnologías e integraciones como Node.js/FastAPI, PostgreSQL, S3 y Wompi/PSE. En el Momento 2, el producto se identifica como AgroCórdoba y el código verificable implementa una aplicación React/TypeScript con backend Flask/SQLAlchemy, persistencia SQLite local y publicaciones y solicitudes de cotización. La aplicación no procesa pagos; el cierre comercial y la forma de pago se acuerdan entre comprador y productor. Por tanto, pagos digitales, trazabilidad y reportes financieros/ODS se mantienen como elementos propuestos en el Momento 1, pero no se deben presentar como implementados en la versión revisada. El equipo debe completar la justificación de los cambios de nombre, stack y alcance con las decisiones reales del proyecto; las capturas aportadas no documentan esas razones.

**Nota de calidad de evidencia:** las imágenes compartidas sirven como referencia del Momento 1, pero no incluyen la bibliografía ni las páginas completas del informe. Las cifras sobre intermediación y las afirmaciones de impacto deben verificarse con fuentes antes de reproducirlas como hechos. Las imágenes de arquitectura del Momento 1 son propuestas, no capturas de la aplicación actual.

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
- Completar las razones reales de los cambios frente al Momento 1; las diferencias observables ya están resumidas en la sección 10.
- Exportar a PDF y abrir el archivo para verificar legibilidad e integridad.
