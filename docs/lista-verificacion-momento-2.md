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
| Esquema SQL de tablas reales | Parcial | Existe localmente `backend/database/schema.sql`, generado a partir de modelos SQLAlchemy. | Publicar el directorio `backend/database/` si se confirma como parte de la entrega y comprobar que el esquema siga sincronizado con los modelos. |
| Base de datos de ejemplo | Parcial | Existe localmente `backend/database/agrocordoba_sample.db`; el generador documenta datos sintéticos. | Publicarla y verificar su contenido sin exponer datos personales; aclarar que no es respaldo de producción. |
| Diagrama entidad-relación | Parcial | Existen localmente `backend/database/ERD.svg` y `ERD.mmd`. | Publicarlos y cotejarlos con el esquema/modelos vigentes. |
| Documentación técnica (frontend, backend, rutas, modelos, validaciones, errores y conexión) | Parcial | Hay borrador local `docs/documentacion-tecnica.md` basado en el código. | Revisión técnica por el equipo; Ayanis debe hacer una contribución genuina y publicarla con su cuenta para evidenciar su participación. |
| Manual de instalación y ejecución local | Listo como borrador | `docs/manual-instalacion.md` documenta Windows, frontend y backend. | Probarlo desde una copia limpia y registrar cualquier error encontrado. |
| Estructura del informe final en PDF | Listo como plantilla | `docs/estructura-informe-final.md`. | Completar campos y evidencias y exportar/revisar el PDF final. El PDF aún no está preparado. |
| Portada, tabla de contenido, descripción, ODS y tecnologías | Parcial | La plantilla incluye esas secciones. | Completar asignatura, docente, sede, fecha y referencias oficiales del ODS. |
| Capturas de pantalla | Pendiente | La plantilla enumera las capturas necesarias; no hay capturas de evidencia insertadas en el informe. | Capturar el sistema en ejecución y ocultar cualquier dato personal o secreto. |
| Enlaces al repositorio y despliegue en el informe | Listo como plantilla | La plantilla contiene los enlaces al repositorio y Render. | Verificar que ambos estén accesibles al preparar el PDF. |
| Base de datos incluida en el informe | Parcial | Existen artefactos locales y secciones preparadas para esquema/diagrama/muestra. | Publicar los artefactos y añadir evidencia visual o descripción en el informe. |
| Justificación de cambios respecto a Momento 1 | Pendiente | La plantilla incluye una tabla de comparación, pero no se encontró la entrega previa. | Aportar el documento/evidencia del Momento 1 y completar la comparación. |
| Correspondencia con todos los requisitos de la guía oficial | Pendiente de cotejo | La guía oficial no se encontró en el repositorio ni fue compartida en los archivos revisados. | Comparar esta lista con el documento oficial y añadir cualquier requisito que falte. |
| Pruebas ejecutadas y resultados reportados | Pendiente de evidencia | Hay pruebas de backend en `backend/tests/`; no se afirma aquí que se hayan ejecutado. | Ejecutar las pruebas pertinentes y registrar resultado, comando y fecha. |

## Próximas acciones sugeridas

1. Ayanis revisa `docs/documentacion-tecnica.md`, corrige o amplía lo que verifique y publica ese aporte desde su cuenta de GitHub.
2. El equipo valida el manual desde una instalación limpia y ejecuta las pruebas que se vayan a reportar.
3. Publicar y verificar los artefactos de `backend/database/`, asegurando que sean sintéticos y coherentes con los modelos.
4. Reunir la guía oficial y la entrega del Momento 1 para cerrar el cotejo y la justificación de cambios.
5. Tomar capturas reales, completar la plantilla del informe, exportar el PDF y revisar el archivo final.
