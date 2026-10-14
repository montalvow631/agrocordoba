# Lista de verificación de entregables de Momento 2

> **Alcance de esta lista:** elaborada con los requisitos compartidos por el equipo en la conversación, no con el documento oficial de la guía, que no está disponible en el repositorio. Compararla con la guía antes de entregar.

Estados: **Listo** = existe evidencia revisada; **Parcial** = hay trabajo, pero falta evidencia o publicación; **Pendiente** = falta preparar o validar.

| Requisito | Estado | Evidencia actual | Falta para cerrar |
|---|---|---|---|
| README con nombre del proyecto | Listo | `README.md` local y publicado. | Ninguna para el alcance compartido. |
| README con ODS, descripción e integrantes | Listo | `README.md`: ODS 8, descripción y nombres Wilmer Caraballo y Ayanis Sanabria. | Revisar que los datos de portada coincidan con la información institucional real. |
| README con tecnologías y guía de instalación local | Listo | Secciones de tecnologías, requisitos y ejecución local en `README.md`. | Validación práctica en otra máquina, si la guía la exige. |
| README con variables y enlace al despliegue | Listo | Variables documentadas y enlace a `https://agrocordoba.onrender.com/`. | Ninguna para el alcance compartido. |
| `.env.example` con nombres, sin secretos reales | Listo | `backend/.env.example` tiene variables sin valores asignados. | Si se agregan variables al código, sincronizar el ejemplo. |
| `.gitignore` protege archivos de entorno | Listo | `.gitignore` ignora `.env` y variantes, con excepción para `.env.example`. La comprobación local confirmó estas reglas. | Antes de cada push, revisar que no se haya seguido un `.env` real previamente. |
| Commits con mensajes descriptivos | Parcial | El historial de `main` tiene varios mensajes descriptivos. | El historial revisado atribuye los commits a `montalvow631`; todavía falta evidencia de contribución publicada desde la cuenta de Ayanis. |
| Esquema SQL de tablas reales | Listo | `backend/database/schema.sql` está generado a partir de modelos SQLAlchemy y publicado en el repositorio. | Ninguna para el alcance compartido; mantenerlo sincronizado si cambian los modelos. |
| Base de datos de ejemplo | Listo | `backend/database/agrocordoba_sample.db` y su generador están publicados; los registros del generador son sintéticos. | Al presentarla, aclarar que no es un respaldo de producción ni contiene usuarios con contraseñas de acceso. |
| Diagrama entidad-relación | Listo | `backend/database/ERD.svg` y `ERD.mmd` están publicados. | Ninguna para el alcance compartido; cotejarlo con futuros cambios de esquema. |
| Documentación técnica (frontend, backend, rutas, modelos, validaciones, errores y conexión) | Parcial | `docs/documentacion-tecnica.md` está publicada como borrador basado en el código. | Revisión técnica por el equipo; Ayanis debe hacer una contribución genuina y publicarla con su cuenta para evidenciar su participación. |
| Manual de instalación y ejecución local | Listo como borrador | `docs/manual-instalacion.md` documenta Windows, frontend y backend. | Probarlo desde una copia limpia y registrar cualquier error encontrado. |
| Estructura del informe final en PDF | Listo como plantilla | `docs/estructura-informe-final.md`. | Completar campos y evidencias y exportar/revisar el PDF final. El PDF aún no está preparado. |
| Portada, tabla de contenido, descripción, ODS y tecnologías | Parcial | La plantilla incluye esas secciones y se completó con facultad, campus, asignatura, docente, integrantes y año según las imágenes del Momento 1. | Verificar que los datos académicos sigan siendo los correctos para Momento 2; agregar referencias oficiales del ODS. |
| Capturas de pantalla | Pendiente | La plantilla enumera las capturas necesarias; no hay capturas de evidencia insertadas en el informe. | Capturar el sistema en ejecución y ocultar cualquier dato personal o secreto. |
| Enlaces al repositorio y despliegue en el informe | Listo como plantilla | La plantilla contiene los enlaces al repositorio y Render. | Verificar que ambos estén accesibles al preparar el PDF. |
| Base de datos incluida en el informe | Parcial | Los artefactos están publicados y la plantilla tiene una sección para describirlos. | Insertar la explicación y evidencia visual en el PDF final. |
| Comparación y justificación de cambios respecto a Momento 1 | Parcial | Se compartieron imágenes del Momento 1 y la plantilla resume diferencias de nombre, alcance funcional y arquitectura, separando propuesta de implementación actual. | El equipo debe explicar las razones reales de los cambios de nombre, stack y alcance. Verificar con las páginas completas y fuentes originales las afirmaciones del Momento 1, incluido el porcentaje de intermediación. |
| Correspondencia con todos los requisitos de la guía oficial | Pendiente de cotejo | La guía oficial no se encontró en el repositorio ni fue compartida en los archivos revisados. | Comparar esta lista con el documento oficial y añadir cualquier requisito que falte. |
| Pruebas ejecutadas y resultados reportados | Pendiente de evidencia | Hay pruebas de backend en `backend/tests/`; no se afirma aquí que se hayan ejecutado. | Ejecutar las pruebas pertinentes y registrar resultado, comando y fecha. |

## Próximas acciones sugeridas

1. Ayanis revisa `docs/documentacion-tecnica.md`, corrige o amplía lo que verifique y publica ese aporte desde su cuenta de GitHub.
2. El equipo valida el manual desde una instalación limpia y ejecuta las pruebas que se vayan a reportar.
3. Revisar los artefactos publicados en `backend/database/`, asegurando que sigan siendo sintéticos y coherentes con los modelos.
4. Completar la guía oficial y explicar las razones reales de los cambios respecto al Momento 1 usando las diferencias documentadas en la plantilla.
5. Tomar capturas reales, completar la plantilla del informe, exportar el PDF y revisar el archivo final.
