# Seguimiento de Eventos

Implementado sobre la estructura V2 existente. El módulo registra acontecimientos de eventos contratados; no modifica la agenda ni administra tareas.

## Alcance

- ADMIN accede a todos los eventos. PRODUCTOR consulta, registra y comenta únicamente en los eventos actualmente asignados a su perfil. CLIENTE no accede a la bitácora interna.
- Registro inmutable con descripción (1–5000 caracteres), tipo (novedad, incidencia, observación, modificación o hito), importancia (baja, media o alta), autor autenticado y fecha del servidor.
- Historial descendente con desempate por ID. Búsqueda sin distinguir mayúsculas, filtros combinables por tipo, importancia, autor y fechas. El filtro visual hasta incluye el día completo en la zona local del navegador.
- Comentarios independientes (1–2000 caracteres), ordenados del más antiguo al más reciente. Sin edición ni eliminación de registros o comentarios.
- Listados reales para ADMIN y PRODUCTOR, detalle de evento, formularios, estados vacíos, carga, errores recuperables y confirmación de guardado.
- Se reutilizan PageHeader, EmptyState, EventoResumenCard, Axios compartido, layouts, React Bootstrap y tema existente. La bitácora y los listados se comparten entre ambos roles. TableToolbar conserva su alcance activo/inactivo y no se fuerza sobre filtros de otro dominio.
- Los archivos adjuntos quedan pendientes de una solución de almacenamiento compatible. No se agrega una tabla ni un endpoint de archivos sin almacenamiento funcional.

## API

Todas las rutas requieren Bearer JWT y rol ADMIN o PRODUCTOR. Los IDs del evento y del registro se comprueban juntos; un evento ajeno responde 404. Los errores Zod usan el 422 del middleware existente. No se devuelven contraseñas ni tokens de recuperación de los autores.

Base `/api/v2/eventos`:

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/` | Eventos accesibles; filtros buscar y estado |
| GET | `/:id` | Resumen del evento accesible |
| GET | `/:id/seguimiento` | Historial; buscar, tipo, importancia, usuarioId, desde, hasta |
| POST | `/:id/seguimiento` | Crear acontecimiento |
| GET | `/:id/seguimiento/autores` | Autores del evento para el filtro |
| GET | `/:id/seguimiento/:seguimientoId` | Registro individual |
| GET | `/:id/seguimiento/:seguimientoId/comentarios` | Comentarios |
| POST | `/:id/seguimiento/:seguimientoId/comentarios` | Agregar comentario |

Fechas API: ISO 8601 con zona horaria; desde inclusivo y hasta exclusivo. Las escrituras verifican permisos y persisten dentro de una transacción serializable. El cliente no puede elegir usuarioId, eventoId o createdAt en el cuerpo.

## Configuración y migración

`backend-v2/.env` contiene la configuración local proporcionada por el usuario. `frontend-v2/.env` contiene `VITE_API_URL=http://localhost:3001/api/v2`. Ambos están ignorados por Git. No incluir credenciales en archivos versionados.

Migración nueva: `20261107200000_add_seguimiento_eventos`, que agrega enums, tablas, relaciones e índices para SeguimientoEvento y ComentarioSeguimiento.

En esta máquina se aplicaron también las cuatro migraciones anteriores que faltaban: `20261017101112_init`, `20261107160000_add_tarifa_hora_tipo_evento`, `20261107163000_add_tipo_evento_modalidad_precio` y `20261107170000_add_tipo_evento_incluye`. No se ejecutó seed ni se reinició la base. Prisma confirmó que no quedan migraciones pendientes.

En otro entorno, desde backend-v2 ejecutar `npx prisma migrate deploy` y `npm run prisma:generate`. Para iniciar localmente, ejecutar `npm run dev` en backend-v2 y frontend-v2, en terminales separadas.

## Verificaciones

- `npx prisma validate` y `npx prisma generate`: correctos.
- `npm run test:seguimiento` (backend-v2): nueve pruebas de validaciones, servicio y HTTP con JWT real y persistencia simulada.
- `npm run test:seguimiento:db` (backend-v2): integración del servicio y cliente Prisma reales con PostgreSQL. Crea fixtures en una transacción y siempre la revierte; no deja datos de prueba. Verifica filtros, permisos, autor/fecha, comentarios y cascadas. Las secuencias PostgreSQL pueden avanzar aunque la transacción se revierta.
- `npm run build` (frontend-v2): correcto; advertencias existentes de Sass/Bootstrap y tamaño de bundle.
- Prueba de interfaz con Playwright y Edge sin ventana, usando respuestas API simuladas: listado, detalle, estado vacío, creación de acontecimiento, comentarios, búsqueda, limpieza de filtros y vista PRODUCTOR. Capturas revisadas en 1440 px y 390 px. Esta prueba no reemplaza la integración con PostgreSQL indicada arriba.
- ESLint de los archivos nuevos de seguimiento: correcto. El lint global presenta siete errores preexistentes en UserAvatar, AuthContext, ThemeContext, CatalogoPage, ProfilePage, CatalogoAdminPage y ProductoresPage.

## Archivos de implementación

Backend:

- `backend-v2/package.json`
- `backend-v2/prisma/schema.prisma`
- `backend-v2/prisma/migrations/20261107200000_add_seguimiento_eventos/migration.sql`
- `backend-v2/src/routes/_index.routes.js`
- `backend-v2/src/routes/seguimiento.routes.js`
- `backend-v2/src/controllers/seguimiento.controller.js`
- `backend-v2/src/schemas/seguimiento.schema.js`
- `backend-v2/src/services/seguimiento.service.js`
- `backend-v2/test/seguimiento.test.js`
- `backend-v2/test/seguimiento.db.test.js`

Frontend:

- `frontend-v2/src/services/seguimiento.service.js`
- `frontend-v2/src/components/eventos/seguimiento.utils.js`
- `frontend-v2/src/components/eventos/SeguimientoPanel.jsx`
- `frontend-v2/src/components/eventos/EventoSeguimientoDetalle.jsx`
- `frontend-v2/src/components/eventos/EventosSeguimientoLista.jsx`
- `frontend-v2/src/pages/admin/EventoDetallePage.jsx`
- `frontend-v2/src/pages/admin/EventosPage.jsx`
- `frontend-v2/src/pages/productor/EventoProductorDetallePage.jsx`
- `frontend-v2/src/pages/productor/EventosProductorPage.jsx`

Documentación: `docs/seguimiento-eventos.md`. Configuración local excluida: los dos `.env` descritos arriba.
