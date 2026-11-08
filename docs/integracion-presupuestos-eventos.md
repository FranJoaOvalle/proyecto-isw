# Integración Solicitudes → Presupuestos → Eventos

Estado de entrega: código preparado, migración NO aplicada por instrucción del usuario. No se habilita aceptación pública. No hay integración comercial E2E ni concurrencia PostgreSQL verificadas. La fuente es el acuerdo v1.2 más: rechazo ADMIN en PENDIENTE/EN_REVISION sin propuestas ni compromisos; emisión únicamente en EN_REVISION.

## Modelo y propiedad de migración

Gestión de Eventos prepara `20261107230000_solicitudes_productor_opcional`. Esta entrega es responsable de la migración compartida: Presupuestos debe reutilizar sus columnas y coordinar ajustes, sin generar otra migración para las mismas relaciones.

- SolicitudEvento → Cliente, TipoEvento y autor obligatorios; estado, inicio/fin tentativos, asistentes, lugar/observaciones opcionales, cierre y timestamps.
- SolicitudEventoCambio: actor, acción, fecha servidor, motivo y JSON anterior/nuevo. Sin cascadas de eliminación.
- Presupuesto.solicitudId opcional en BD para históricos, con índice. Una solicitud tiene varias propuestas.
- Evento.solicitudId opcional y único; Evento.presupuestoId conserva su unicidad y relación obligatoria existentes.
- Evento.productorId/relación opcionales; los productores existentes no se desasignan. Se conserva onDelete Restrict.
- No hay datos comerciales duplicados en la solicitud ni solicitudes inventadas para el legado.

Los nuevos presupuestos de este flujo deben tener solicitudId obligatorio desde el servicio de Presupuestos. No basta con que la columna admita null para históricos. También debe comprobarse coherencia de clienteId/tipoEventoId con la solicitud; la formalización vuelve a verificarla.

## API implementada

Base `/api/v2/solicitudes`, JWT y roles ADMIN/CLIENTE. PRODUCTOR no tiene acceso.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/` | CLIENTE crea para sí; ADMIN envía clienteId existente y activo |
| GET | `/` | Listado paginado y restringido al propietario para CLIENTE |
| GET | `/:id` | Detalle, metadatos de propuestas y resumen autorizado del evento |
| GET | `/:id/historial` | Acciones, motivo y cambios de la solicitud; sin datos de productores |
| PATCH | `/:id` | Edición auditada permitida por estado y guardas comerciales |
| POST | `/:id/revision` | ADMIN; PENDIENTE → EN_REVISION, idempotente |
| POST | `/:id/rechazo` | ADMIN; motivo obligatorio, sin evento ni obligaciones sin certificar |
| POST | `/:id/retiro` | CLIENTE; solo PENDIENTE y sin ninguna propuesta |

GET lista: `buscar`, `estado`, `pagina` (1 por defecto), `limite` (20 por defecto, máximo 100). Resultado `{items,total,pagina,limite}`. Búsqueda por tipo o lugar. Nunca cambia estados al leer.

Ejemplo de creación CLIENTE:

```json
{
  "tipoEventoId": 1,
  "inicio": "2090-01-01T10:00:00-03:00",
  "fin": "2090-01-01T12:00:00-03:00",
  "asistentes": 80,
  "lugar": "Salón Central",
  "observaciones": "Preferimos una ceremonia al aire libre."
}
```

Los IDs deben existir. ADMIN agrega clienteId; CLIENTE tiene prohibido enviarlo. Autor, estado y fechas de auditoría provienen del servidor. Inicio futuro, término posterior y asistentes positivos. Zod conserva el 422 existente; permisos 403, ownership 404, reglas de negocio 409.

CLIENTE modifica datos tentativos en PENDIENTE, sin cambiar tipo. ADMIN corrige en PENDIENTE o EN_REVISION; no cambia cliente histórico de la solicitud. Con cualquier presupuesto, la edición queda bloqueada por defecto hasta que el detector de emisión/versionado comercial sea implementado. No se reabre ni edita CONTRATADA/RECHAZADA. Retiro queda RECHAZADA/RETIRO_CLIENTE y se presenta como Retirada.

## Puntos exactos que conecta Presupuestos

1. Antes de emitir, llamar `solicitudService.validarEmision({tx, solicitudId, actorId})`. Actor ADMIN activo, solicitud EN_REVISION y bloqueo de fila mantenido hasta el commit. La operación no emite una propuesta por sí misma.
2. Mantener ese bloqueo también en las operaciones de creación, vinculación o modificación de presupuestos para no competir con edición/cierre de solicitudes.
3. Implementar los adaptadores de `backend-v2/src/services/integracionPresupuestos.service.js`:
   - `verificarAceptacion({tx, solicitud, presupuesto, actorId})`: consultar versión enviada, vigencia, prevalidación ADMIN y evidencia de aceptación CLIENTE dentro de tx; lanzar error si no se puede comprobar. Retorna al completar la verificación, sin banderas del navegador.
   - `verificarEdicionSolicitud({tx, solicitudId, actorId, cambios})`: detector de emisión y coordinación de versionado, sin sobrescritura de propuestas emitidas.
   - `verificarCierreSolicitud({tx, solicitudId, actorId})`: comprobar propuestas, pagos y compromisos resueltos; fallar cerrado si la consulta no está disponible.

Los tres adaptadores lanzan 409 por defecto. Las propuestas rechazadas o vencidas no cierran la solicitud automáticamente. Sin presupuestos vinculados, el modelo actual no tiene pagos ni otros compromisos asociados directamente a una solicitud; si se agrega otro origen de obligaciones, su verificación debe incluirse antes de permitir cierre.

## Formalización interna y transacción única

`formalizarContratacion({tx, solicitudId, presupuestoId, actorId})`, en `backend-v2/src/services/formalizacion.service.js`.

- Solo actor CLIENTE activo y propietario, incluso para una respuesta idempotente.
- tx lo crea Presupuestos con `isolationLevel: "ReadCommitted"`. El servicio comprueba el aislamiento y no abre transacciones.
- Orden común: fila Solicitud → fila Presupuesto → TipoEvento en lectura compartida → claves de disponibilidad ordenadas.
- Aceptación expresa y cambio a ACEPTADO deben ocurrir dentro del mismo tx, antes de invocar la formalización; el adaptador verifica las evidencias. No basta con estado ACEPTADO. Se exige venceAt futuro no nulo.
- Datos definitivos inicio/fin, recinto y asistentes proceden del presupuesto, y cliente/tipo deben coincidir con solicitud. Se crea CONFIRMADO, productor null, imagen personalizada null (hereda Catálogo).
- Registra Evento, Solicitud CONTRATADA y su auditoría dentro de tx.
- Mismo par solicitud/presupuesto devuelve el Evento existente, incluso cancelado, sin volver a comprobar vigencia ni tipo activo ni duplicar auditoría. Otro presupuesto para la misma solicitud devuelve 409.
- No existe endpoint de formalización ni ruta para aceptar: la función predeterminada queda cerrada por el adaptador pendiente.

Ejemplo orientativo del futuro orquestador de Presupuestos, NO habilitado en esta entrega:

```js
return prisma.$transaction(async tx => {
    // Autorizar CLIENTE y bloquear Solicitud y Presupuesto en el orden común.
    // Consultar envío, versión, prevalidación y vigencia persistidos.
    // Registrar evidencia de aceptación y ACEPTADO dentro de este tx.
    return formalizarContratacion({ tx, solicitudId, presupuestoId, actorId });
}, { isolationLevel: "ReadCommitted" });
```

El orquestador debe efectuar la misma comprobación idempotente ANTES de exigir EN_REVISION o registrar de nuevo la aceptación. Un fallo del servicio se propaga para revertir también la aceptación. No capturar y continuar dentro de tx.

Presupuestos es responsable de reintentar la transacción COMPLETA ante deadlocks/conflictos recuperables, con límite (por ejemplo, 3 intentos). Ante unicidad, primero rollback; luego reconsultar con ownership en una nueva consulta: mismo par devuelve existente; distinto par es 409. Nunca reconsultar dentro de una transacción abortada ni reintentar únicamente la creación del Evento.

## Disponibilidad y productor opcional

`disponibilidad.service.js` comparte la regla entre edición/asignación, cancelación y formalización. Intervalos `[inicio,fin)`. CANCELADO no ocupa; los demás estados conservan su intervalo, incluido COMPLETADO histórico.

Normalización: Unicode NFD, eliminación de marcas combinantes, minúsculas, trim y colapso de espacios. No es casefold Unicode completo ni equivalencia de alias. Espacios independientes necesitan nombres distintos. Solo horario contratado, sin montaje/desmontaje.

Bloqueos transaccionales PostgreSQL mediante pg_advisory_xact_lock/hashtextextended, por recinto normalizado y por productor cuando exista. Las claves anteriores/nuevas se deduplican y ordenan; lecturas de colisión posteriores al bloqueo bajo ReadCommitted. Las colisiones del hash solo producen espera adicional. Los escritores deben usar el helper; escritura SQL externa o servicios futuros que lo omitan quedan fuera del protocolo.

La validación operativa de Agenda se conserva para evitar regresiones, pero no constituye reserva física y Agenda no participa del protocolo de reserva exclusiva del recinto. No se garantiza disponibilidad física, alias ni reservas de recursos materiales.

ADMIN asigna/reasigna productor mediante PATCH `/api/v2/eventos/:id` con `{ "productorId": 4 }`, usando existencia/rol/estado activo, disponibilidad y EventoCambio. Eventos cancelados/completados no admiten asignación. Los sin productor permanecen visibles para ADMIN y excluidos para PRODUCTOR. Agenda ya tenía fallback de productor nulo; se corrigió el detalle compartido que lo asumía obligatorio.

## Navegación y privacidad

- ADMIN: `/admin/solicitudes` y `/admin/solicitudes/:id`, acceso desde su navegación.
- CLIENTE: `/cliente/solicitudes` y `/cliente/solicitudes/:id`, acceso desde su panel.
- Reutiliza PageHeader, EmptyState, ConfirmModal, TableToolbar, Bootstrap y Axios. No modifica Catálogo administrativo, Compra/Contrato ni las pantallas de otros compañeros.
- La etapa principal pasa a estado de Evento tras contratar. La solicitud y propuestas quedan como antecedentes; el cliente solo recibe el resumen de su evento, no bitácora, EventoCambio ni datos de productores.

## Verificaciones y límites actuales

- `npm run test:solicitudes`: 16 pruebas de servicio/contrato y HTTP con JWT, dobles de Prisma en memoria. El rollback comprobado es simulado, NO PostgreSQL.
- `npm run test:seguimiento`: 9 pruebas existentes con persistencia simulada.
- `npx prisma validate`: correcto. SQL generado comparando dos archivos schema, sin consultar ni migrar PostgreSQL.
- ESLint de archivos frontend modificados: correcto. `npm run build`: correcto, con advertencias previas de Sass/Bootstrap y tamaño de bundle.
- Playwright/Edge con API simulada: creación/edición/retiro CLIENTE, revisión ADMIN, evento sin productor y asignación. Capturas desktop/mobile revisadas.
- Pendiente de autorización: respaldo, aplicación de migración y regeneración del cliente, pruebas PostgreSQL de relaciones/rollback y pruebas concurrentes entre conexiones. Pendiente de Presupuestos: emisión, aceptación persistida, verificador comercial y orquestador. No activar aceptación pública hasta completar estas pruebas.

El código requiere la migración y el cliente Prisma actualizado para ejecutar las nuevas rutas contra la base real. No presentar el flujo comercial como operativo solo porque compila o pasan los mocks.

## Respaldo antes de migrar — no ejecutado

La configuración inspeccionada apunta a localhost:5432, base mydb, esquema nes_eventos_v2. Es el destino de este equipo; la URL no demuestra que sea exclusivo: podría haber otros usuarios, procesos, Docker o un túnel. No se expusieron credenciales ni se modificó la base.

Desde una terminal con las herramientas PostgreSQL instaladas, usando una carpeta existente:

```powershell
pg_dump -h localhost -p 5432 -U postgres -W -Fc -f "C:\Backups\mydb-antes-solicitudes.dump" mydb
pg_restore --list "C:\Backups\mydb-antes-solicitudes.dump"
```

Respalda toda la base (incluye historial de migraciones). La contraseña se solicita de forma interactiva. Verifica el código de salida, conserva el archivo fuera del repositorio y prueba restauración en otra base aislada. Listar el archivo no demuestra por sí solo que la restauración completa funcione. Si las herramientas no están en PATH, utiliza la carpeta bin de PostgreSQL o Backup de pgAdmin, formato Custom. No restaurar sobre mydb para verificarlo.

Solo después de autorización explícita: aplicar migración con el procedimiento acordado, regenerar cliente Prisma y reiniciar el backend. No ejecutar seed, reset ni db push. Si Windows bloquea el motor Prisma, coordinar el cierre del proceso que lo usa; no finalizar procesos del usuario automáticamente.
