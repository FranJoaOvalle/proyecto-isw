# Mejoras de Eventos

La implementación amplía el módulo V2 existente y conserva sus rutas, autenticación, layouts y bitácora.

## Reutilización y búsqueda

Se reutiliza TableToolbar de Catálogo, agregando opciones de estado configurables sin cambiar las opciones predeterminadas del catálogo. Eventos conserva la búsqueda del backend por tipo o lugar y los botones Buscar y Limpiar; Enter envía el formulario. Controles y tarjetas comparten Container. El toolbar utiliza la distribución responsive de Catálogo, sin márgenes correctivos.

Archivos: `frontend-v2/src/components/admin/TableToolbar.jsx`, `frontend-v2/src/components/eventos/EventosSeguimientoLista.jsx`.

## Edición y cancelación

Solo ADMIN modifica eventos. PRODUCTOR mantiene consulta y seguimiento de sus eventos asignados. El formulario precarga inicio, término, lugar, asistentes, observaciones e imagen. No cambia cliente, productor, tipo, presupuesto, pagos ni recursos históricos. El nombre visible sigue siendo el tipo de evento: Evento no tiene nombre propio.

PATCH `/api/v2/eventos/:id` valida campos mediante Zod, comprueba el orden de fechas y conflictos de productor/lugar con eventos y actividades. Guarda EventoCambio por cada campo modificado en una transacción serializable. No admite edición de eventos cancelados ni completados.

PATCH `/api/v2/eventos/:id/cancelar` admite únicamente CONFIRMADO o POSPUESTO. Cancelar EN_CURSO, COMPLETADO o CANCELADO produce conflicto. No existe reactivación. ConfirmModal explica que se conservan todos los antecedentes. El detalle se actualiza después de guardar; volver al listado recupera datos actuales manteniendo la búsqueda cuando se ejecuta dentro de la vista.

DELETE `/api/v2/eventos/:id` comprueba rol y estado. En el schema actual todos los eventos tienen presupuesto obligatorio, por lo que el borrado físico queda bloqueado explícitamente con 409. La interfaz muestra la acción deshabilitada para cancelados y explica el motivo. No se ejecuta delete, ni se borran relaciones en cascada. No existe actualmente un evento contratado que cumpla los requisitos para eliminarlo de manera segura.

## Imágenes

Catálogo utiliza URL, no selección ni carga de archivos. Evento reutiliza imagen_url como referencia personalizada opcional y obtiene la imagen heredada mediante tipoEvento.imagen_url, sin copiarla. La prioridad compartida en tarjetas y detalle es imagen propia, imagen del tipo y placeholder. Si una imagen falla, se prueba la siguiente alternativa.

El formulario incluye Imagen del evento con opciones heredada (predeterminada) y personalizada. Solo muestra el campo URL cuando corresponde; exige HTTPS en React y Zod y ofrece vista previa. Guardar la opción heredada persiste null únicamente en Evento.imagen_url. No modifica Catálogo. Cambiar la imagen del catálogo se refleja al volver a consultar los eventos heredados; no altera las referencias personalizadas. Editar otros campos conserva el modo seleccionado.

No hay nueva migración, almacenamiento ni endpoints de upload para esta mejora. Se mantienen las proporciones y el placeholder existentes.

Migración aditiva aplicada: `20261107220000_add_evento_imagen`. No modifica migraciones anteriores ni datos históricos.

Archivos backend: `src/services/evento.service.js`, `src/controllers/seguimiento.controller.js`, `src/routes/seguimiento.routes.js`, `src/schemas/seguimiento.schema.js`, `prisma/schema.prisma` y la migración mencionada, todos bajo backend-v2.

Archivos frontend: `src/components/eventos/EventoAcciones.jsx`, `EventoImagen.jsx`, `EventoResumenCard.jsx`, `EventoSeguimientoDetalle.jsx` y `src/services/seguimiento.service.js`, bajo frontend-v2.

## Validación

- Prisma validate: correcto.
- Nueve pruebas HTTP/servicio y una prueba con PostgreSQL real: correctas. La prueba real revierte los fixtures y comprueba imagen persistida, conservación del presupuesto, auditoría, permisos, cancelación repetida, rechazo del borrado e historial intacto.
- Pruebas ampliadas en `backend-v2/test/seguimiento.test.js` y `seguimiento.db.test.js`.
- ESLint de los archivos modificados del frontend: correcto.
- Build del frontend: correcto, con advertencias existentes de Bootstrap/Sass y tamaño del bundle.
- Prueba Playwright/Edge con respuestas API simuladas: listado, detalle, edición precargada, imagen URL y vista previa, guardado, persistencia al recargar, cancelación, borrado deshabilitado, seguimiento y comentarios. Capturas revisadas en escritorio (1440), tablet (768), móvil (390) y modo oscuro. La persistencia real se verificó por separado con PostgreSQL.
- Prisma generate actualiza el código generado pero falla al reemplazar query_engine-windows.dll.node por EPERM incluso fuera del sandbox. El motor existente permite ejecutar la integración PostgreSQL correctamente. Cuando el proceso que mantiene cargado ese archivo se cierre, ejecutar `npm run prisma:generate` desde backend-v2. No se finalizó ningún proceso del usuario para desbloquearlo.

No se ejecutó seed, no se alteraron credenciales y no se realizaron operaciones Git remotas.
