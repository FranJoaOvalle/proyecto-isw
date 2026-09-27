# RF03: registro de recursos (primer incremento)

`POST /api/recursos` registra un recurso y devuelve HTTP 201 con el registro.
Requiere un token Bearer obtenido mediante el login existente y un usuario con
rol `OPERACIONES_LOGISTICA` (Jefe de Operaciones y Logística) o `BODEGA`
(encargado de bodega). Estos roles deben asignarse en la base de datos por el
administrador; este incremento no incorpora una interfaz para asignarlos.
Los demás roles reciben 403; una sesión ausente o inválida recibe 401.

```json
{
  "tipo": "Sonido",
  "nombre": "Parlante activo",
  "cantidad": 2,
  "estado": "DISPONIBLE",
  "observaciones": "Equipo incorporado a bodega"
}
```

- Tipo: texto de 2 a 80 caracteres; permite incorporar nuevas clases de recursos.
- Nombre: texto de 2 a 100 caracteres.
- Cantidad: número entero entre 0 y 2147483647; cero permite registrar stock agotado.
- Estado: `DISPONIBLE` (predeterminado), `EN_REPARACION` o `RETIRADO`.
- Observaciones: opcionales, hasta 2000 caracteres; admite null.

Se recortan espacios exteriores en los textos y se rechazan campos desconocidos.
Los datos inválidos reciben 422 y no se guardan. La migración también impide
cantidades negativas en la base de datos.

## Preparación

Desde `backend`, instalar con `npm ci`, configurar `DATABASE_URL` y `JWT_SECRET`
en `.env`, aplicar `npx prisma migrate deploy` y ejecutar `npx prisma generate`.
La base debe tener las migraciones previas del proyecto aplicadas correctamente.
Iniciar con `npm run dev`.

## Verificación

Ejecutar `node --test test/recurso.test.js`. Las pruebas recorren las rutas,
la autenticación, los permisos, la validación y el controlador/servicio,
sustituyendo únicamente Prisma por persistencia simulada. No verifican una
conexión real a PostgreSQL ni la aplicación de migraciones.

## Próximos incrementos

Consulta de recursos, modificación autorizada, desactivación que conserve el
historial y formularios de interfaz, cada uno en su propio commit. Las futuras
asignaciones a eventos deben preservar sus referencias; este incremento no
incluye eliminación ni asignaciones.
