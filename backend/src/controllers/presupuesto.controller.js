const { PrismaClient } = require('@prisma/client');

// Instancia de Prisma para interactuar con la base de datos PostgreSQL
const prisma = new PrismaClient();

// Crea un presupuesto calculando subtotales y guardando cabecera y detalle simultáneamente
const crearPresupuesto = async (req, res) => {
  try {
    const { clienteId, descuento, observaciones, servicios } = req.body;

    let subtotalCalculado = 0;
    // Recorre los servicios para calcular el subtotal de cada ítem y el total acumulado
    const detalleServicios = servicios.map(item => {
      const subtotalItem = item.cantidad * item.precioUnitario;
      subtotalCalculado += subtotalItem;
      return {
        servicioId: item.servicioId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: subtotalItem
      };
    });

    const totalCalculado = subtotalCalculado - (descuento || 0);

    // Inserción transaccional: guarda el presupuesto y sus servicios asociados en un solo paso
    const nuevoPresupuesto = await prisma.presupuesto.create({
      data: {
        clienteId,
        subtotal: subtotalCalculado,
        descuento: descuento || 0,
        total: totalCalculado,
        observaciones,
        servicios: { create: detalleServicios }
      },
      include: { servicios: true, cliente: true }
    });

    res.status(201).json(nuevoPresupuesto);
  } catch (error) {
    console.error("Error al crear presupuesto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor al crear el registro" });
  }
};

// Obtiene todos los presupuestos activos filtrando aquellos con borrado lógico
const obtenerPresupuestos = async (req, res) => {
  try {
    // Excluye los registros con estado INACTIVO para no mostrarlos en el frontend
    const presupuestos = await prisma.presupuesto.findMany({
      where: { estado: { not: "INACTIVO" } },
      include: { cliente: true }
    });
    res.status(200).json(presupuestos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al consultar los presupuestos" });
  }
};

// Aplica borrado lógico cambiando el estado a INACTIVO, validando que no esté ACEPTADO
const eliminarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica la existencia y el estado actual del presupuesto antes de modificarlo
    const presupuestoExistente = await prisma.presupuesto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!presupuestoExistente) {
      return res.status(404).json({ mensaje: "El presupuesto solicitado no existe" });
    }

    // Regla de negocio: Protege la integridad financiera bloqueando la eliminación de presupuestos aceptados
    if (presupuestoExistente.estado === "ACEPTADO") {
      return res.status(400).json({ mensaje: "No es posible eliminar un presupuesto que ya ha sido aceptado" });
    }

    // Ejecuta el borrado lógico actualizando el estado, preservando el historial financiero
    const presupuestoEliminado = await prisma.presupuesto.update({
      where: { id: parseInt(id) },
      data: { estado: "INACTIVO" }
    });

    res.status(200).json({ mensaje: "Presupuesto archivado correctamente", presupuestoEliminado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al intentar eliminar el presupuesto" });
  }
};

// Exportación clásica de CommonJS para que las rutas puedan usar estas funciones
module.exports = { crearPresupuesto, obtenerPresupuestos, eliminarPresupuesto };