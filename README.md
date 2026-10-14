# NES Eventos V2 — Guía de trabajo

Esta guía resume la estructura, alcance y convenciones de la versión V2 del proyecto. Todas las ramas `refactor/*` parten actualmente desde la misma base funcional.

## 1. Ramas

La estructura de trabajo es:

```text
refactor/main
└── versión estable del refactor

refactor/dev
└── rama de integración del equipo

refactor/<nombre>
└── rama personal de cada integrante
```

Ramas personales actuales:

```text
refactor/francisco
refactor/sebastian
refactor/oscar
refactor/mateo
refactor/benjamin
```

Para comenzar trabajo nuevo:

```bash
git switch refactor/<nombre>
git fetch origin
git merge origin/refactor/dev
```

Cada integrante desarrolla su RF en su propia rama.

Los cambios terminados deben integrarse primero en:

```text
refactor/dev
```

`refactor/main` debe mantenerse como versión estable.

---

## 2. Stack V2

### Backend

```text
Node.js
Express
Prisma
PostgreSQL
Zod
JWT
bcryptjs
```

Ruta:

```text
backend-v2/
```

La API utiliza:

```text
/api/v2
```

### Frontend

```text
React
Vite
React Router
React Bootstrap
Bootstrap Icons
Sass
Axios
```

Ruta:

```text
frontend-v2/
```

El frontend utiliza Bootstrap como sistema visual común. No utilizar Tailwind ni crear un segundo sistema de estilos para módulos nuevos.

El color `primary` del proyecto ya está personalizado con el morado de NES.

---

## 3. Roles

V2 utiliza solamente tres roles:

```text
ADMIN
PRODUCTOR
CLIENTE
```

No existen en V2 roles como:

```text
COMERCIAL
PRODUCCION
```

Esos pertenecen al diseño anterior.

### ADMIN

Puede administrar información global del sistema:

```text
Panel
Clientes
Productores
Catálogo
Eventos
Recursos
Presupuestos
Pagos
Perfil
```

### PRODUCTOR

Trabaja principalmente con los eventos que tiene asignados:

```text
Panel
Eventos asignados
Detalle de evento
Perfil
```

### CLIENTE

Puede consultar el catálogo y gestionar sus propios eventos:

```text
Panel
Catálogo
Compra / Contrato
Mis eventos
Detalle de evento
Perfil
```

---

## 4. Catálogo: TipoEvento vs Evento

Esta distinción es importante.

### TipoEvento

`TipoEvento` representa un producto del catálogo.

Ejemplos:

```text
Matrimonio
Cumpleaños
Graduación
Evento corporativo
```

Contiene información como:

```text
nombre
descripcion
precioBase
activo
```

Es lo que aparece en:

```text
/catalogo
/admin/catalogo
```

El cliente o usuario público solo ve tipos de evento activos.

El ADMIN puede:

```text
crear
editar
activar
desactivar
```

### Evento

`Evento` representa una contratación real.

Ejemplo:

```text
Matrimonio de Juan Pérez
24 de octubre
Centro de eventos X
120 asistentes
Productor asignado
```

Un evento se relaciona con:

```text
Cliente
Productor
TipoEvento
Presupuesto
Recursos
Pagos
Cambios
Calificación
```

Por lo tanto:

```text
TipoEvento = catálogo
Evento     = evento contratado
```

No confundir ambos conceptos.

---

## 5. No existe Servicio en V2

El schema actual no posee una entidad `Servicio`.

Por lo tanto, no desarrollar nuevamente:

```text
Servicio
CategoriaServicio
Servicios.jsx
Categorias.jsx
servicio.service.js
categoria.service.js
```

Ese código pertenece al alcance anterior.

El catálogo actual está compuesto exclusivamente por `TipoEvento`.

---

## 6. Modelo principal

Las entidades principales del schema V2 son:

```text
Usuario

Cliente
├── ClientePersona
└── ClienteEmpresa

Productor

TipoEvento

Recurso
├── RecursoMaterial
└── RecursoHumano

Presupuesto
└── PresupuestoRecurso

Pago

Evento
├── EventoRecurso
├── EventoCambio
└── Calificacion
```

### Flujo general

De forma simplificada:

```text
Cliente
   ↓
TipoEvento
   ↓
Compra / Cotización
   ↓
Presupuesto
   ↓
Pago / anticipo
   ↓
Evento
   ↓
Productor + Recursos
   ↓
Realización
   ↓
Calificación
```

---

## 7. Clientes

Un cliente puede ser:

```text
PERSONA
EMPRESA
```

### PERSONA

Datos específicos:

```text
rut
nombres
apellidos
telefono
```

### EMPRESA

Datos específicos:

```text
rutEmpresa
razonSocial
casaMatriz
telefono
```

La cuenta de acceso siempre se encuentra en `Usuario`.

El estado activo/inactivo también pertenece a:

```text
Usuario.activo
```

No duplicar un campo `activo` en `Cliente` o `Productor`.

---

## 8. Productores

Un productor posee:

```text
nombres
apellidos
telefono
usuario
eventos asignados
```

El ADMIN administra sus cuentas.

El PRODUCTOR no crea eventos globalmente: trabaja sobre los eventos que tenga asignados.

---

## 9. Recursos

Los recursos pueden ser:

```text
HUMANO
MATERIAL
```

### Recurso material

Puede tener, entre otros datos:

```text
unidad
stockTotal
precioUnitario
```

### Recurso humano

Posee un origen:

```text
INTERNO
EXTERNO
```

Los recursos pueden utilizarse tanto en presupuestos como posteriormente en eventos.

---

## 10. Presupuestos

Un `Presupuesto` representa una cotización asociada a:

```text
Cliente
TipoEvento
Fecha
Lugar
Asistentes
Recursos
```

Guarda snapshots de precios para que modificaciones futuras del catálogo no alteren presupuestos ya realizados.

Estados disponibles:

```text
BORRADOR
PENDIENTE_PAGO
ACEPTADO
CANCELADO
VENCIDO
```

En el frontend del CLIENTE no existe necesariamente una página independiente llamada "Mis presupuestos".

El flujo se concentra actualmente en:

```text
/cliente/compra
```

es decir:

```text
Compra / Contrato
```

El ADMIN sí posee un módulo de presupuestos para gestión global.

---

## 11. Pagos

Los pagos pertenecen a un presupuesto.

Tipos:

```text
ANTICIPO
SALDO
```

Estados:

```text
PENDIENTE
PAGADO
FALLIDO
REEMBOLSADO
```

---

## 12. Estados de Evento

Los eventos pueden estar en:

```text
CONFIRMADO
POSPUESTO
EN_CURSO
COMPLETADO
CANCELADO
```

No crear estados nuevos directamente desde frontend sin modificar primero el dominio correspondiente.

---

## 13. Rutas principales del frontend

### Públicas

```text
/                     Inicio
/catalogo             Catálogo de tipos de evento
/login                Inicio de sesión
/register             Registro de cliente
/forgot-password      Recuperar contraseña
/reset-password       Restablecer contraseña
```

### Usuario autenticado

```text
/perfil
```

### ADMIN

```text
/admin
/admin/clientes
/admin/productores
/admin/catalogo
/admin/eventos
/admin/eventos/:id
/admin/recursos
/admin/presupuestos
/admin/pagos
```

### PRODUCTOR

```text
/productor
/productor/eventos
/productor/eventos/:id
```

### CLIENTE

```text
/cliente
/cliente/compra
/cliente/eventos
/cliente/eventos/:id
```

---

## 14. Componentes compartidos

Antes de crear UI nueva, revisar:

```text
src/components/
```

Actualmente existen componentes reutilizables como:

```text
PageHeader
EmptyState
ConfirmModal
UserAvatar
MainNavbar
ModulePlaceholder
```

También existen:

```text
components/admin/TableToolbar.jsx
components/catalogo/CatalogoCard.jsx
components/eventos/EventoResumenCard.jsx
```

Evitar duplicar componentes si una pieza existente puede reutilizarse.

### PageHeader

Para títulos, descripción y acciones principales.

### EmptyState

Para páginas o listados sin registros.

### ConfirmModal

Para confirmaciones como:

```text
activar
desactivar
cancelar
otras acciones destructivas
```

Evitar `window.confirm()` en componentes nuevos.

### TableToolbar

Para búsqueda y filtros de tablas administrativas.

### CatalogoCard

Representación visual compartida de un `TipoEvento`.

En catálogo público:

```text
solo lectura
```

En administración:

```text
editar
activar/desactivar
```

### EventoResumenCard

Card base para listados de eventos de:

```text
ADMIN
PRODUCTOR
CLIENTE
```

---

## 15. Estructura de páginas

```text
src/pages/
├── HomePage.jsx
├── CatalogoPage.jsx
├── ProfilePage.jsx
│
├── auth/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ForgotPasswordPage.jsx
│   └── ResetPasswordPage.jsx
│
├── admin/
│   ├── AdminPage.jsx
│   ├── ClientesPage.jsx
│   ├── ProductoresPage.jsx
│   ├── CatalogoAdminPage.jsx
│   ├── EventosPage.jsx
│   ├── EventoDetallePage.jsx
│   ├── RecursosPage.jsx
│   ├── PresupuestosPage.jsx
│   └── PagosPage.jsx
│
├── productor/
│   ├── ProductorPage.jsx
│   ├── EventosProductorPage.jsx
│   └── EventoProductorDetallePage.jsx
│
└── cliente/
    ├── ClientePage.jsx
    ├── CompraContratoPage.jsx
    ├── MisEventosPage.jsx
    └── EventoClienteDetallePage.jsx
```

Algunas páginas actualmente son esqueletos destinados a que cada integrante implemente su RF sin tener que volver a crear rutas, layouts o navegación.

---

## 16. Servicios frontend

Los servicios HTTP deben ubicarse en:

```text
src/services/
```

El cliente Axios compartido está en:

```text
_api.js
```

No crear una nueva instancia de Axios para cada módulo.

Ejemplo conceptual:

```js
import api from "./_api";

export const getEventos = async () => {
    const response = await api.get("/eventos");
    return response.data;
};
```

Cada dominio puede crear su propio archivo:

```text
evento.service.js
recurso.service.js
presupuesto.service.js
pago.service.js
```

cuando sus endpoints correspondientes existan.

---

## 17. Autenticación

El backend utiliza JWT.

Endpoints principales ya implementados:

```text
POST /api/v2/auth/login
POST /api/v2/auth/registro
POST /api/v2/auth/forgot-password
POST /api/v2/auth/reset-password
GET  /api/v2/usuarios/me
```

La autorización del backend debe seguir siendo la fuente real de seguridad.

Ocultar botones en React no reemplaza la validación de permisos del backend.

---

## 18. Seed de desarrollo

El seed V2 está diseñado para entregar una base completa y reproducible a todo el equipo.

Ejecutar desde:

```text
backend-v2/
```

con:

```bash
npx prisma db seed
```

IMPORTANTE:

El seed realiza un wipe completo de los datos de la base antes de volver a poblarla.

No ejecutar contra una base que contenga información que se quiera conservar.

Después del seed se crean:

```text
11 usuarios
6 clientes
4 productores
6 tipos de evento
13 recursos
9 presupuestos
13 pagos
6 eventos
1 calificación
4 cambios de evento
```

---

## 19. Credenciales de desarrollo

Todos los usuarios del seed utilizan:

```text
Prueba123!
```

### ADMIN

```text
admin.prueba@nes.cl
```

### CLIENTES

```text
cliente1.prueba@nes.cl
cliente2.prueba@nes.cl
cliente3.prueba@nes.cl
cliente4.prueba@nes.cl
cliente5.prueba@nes.cl
cliente6.prueba@nes.cl
```

### PRODUCTORES

```text
productor1.prueba@nes.cl
productor2.prueba@nes.cl
productor3.prueba@nes.cl
productor4.prueba@nes.cl
```

Estas cuentas son únicamente para desarrollo.

---

## 20. Prisma

Después de modificar el schema:

```bash
npx prisma generate
```

Si corresponde crear una migración:

```bash
npx prisma migrate dev --name nombre_migracion
```

No editar migraciones existentes que ya hayan sido compartidas con el equipo.

Si se necesita modificar el schema, coordinar primero el cambio para evitar conflictos entre RF.

---

## 21. Convenciones de frontend

Utilizar:

```text
React Bootstrap
Bootstrap Icons
variables Bootstrap
tema claro/oscuro existente
```

Evitar:

```text
Tailwind
CSS global innecesario
colores hardcodeados cuando Bootstrap ya dispone de variantes
layouts paralelos al MainLayout/AdminLayout
```

Ejemplos preferidos:

```jsx
<Button variant="primary">
<Alert variant="danger">
<Badge bg="success">
<div className="bg-body-tertiary">
```

en lugar de crear colores manualmente.

---

## 22. Validación

Los formularios nuevos deberían seguir el patrón existente:

```jsx
<Form noValidate validated={validated}>
```

con:

```jsx
<Form.Control.Feedback type="invalid" tooltip>
```

La validación del frontend mejora UX.

La validación real de datos debe seguir existiendo también en backend mediante Zod.

---

## 23. Respuestas y errores

Los mensajes dirigidos al usuario deben mantenerse en español.

Ejemplos:

```text
Credenciales incorrectas.
No fue posible cargar los eventos.
No fue posible guardar el recurso.
Uno o más datos proporcionados no son válidos.
```

No exponer errores internos de Prisma directamente al frontend.

---

## 24. Antes de implementar un RF

Revisar primero:

1. El modelo correspondiente en `schema.prisma`.
2. Si ya existe una ruta o página placeholder.
3. Si ya existe un componente reutilizable.
4. Los endpoints existentes.
5. Los permisos del rol correspondiente.
6. Los datos disponibles en el seed.

La idea del refactor es que cada RF se integre sobre una arquitectura común, no que cada integrante construya un módulo aislado con convenciones propias.

---

## 25. Regla principal del refactor

Antes de agregar una entidad, página, rol o flujo nuevo, verificar que realmente forme parte del schema y del alcance V2.

En especial:

```text
TipoEvento ≠ Evento
No existe Servicio
Solo existen ADMIN, PRODUCTOR y CLIENTE
```

Esas tres reglas evitan volver accidentalmente al diseño anterior.
