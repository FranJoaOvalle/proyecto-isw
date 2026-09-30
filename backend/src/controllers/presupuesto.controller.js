const { PrismaClient } = require('../../../generated/prisma');
const prisma = new PrismaClient();

// Crea un presupuesto calculando subtotales y guardando cabecera y detalle simultáneamente
const crearPresupuesto = async (req, res) => {
  try {
    const { clienteId, descuento, observaciones, servicios } = req.body;

    let subtotalCalculado = 0;
    // Recorre los servicios para calcular el subtotal por ítem y el subtotal general
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

    // Aplica el descuento al subtotal para obtener el total final
    const totalCalculado = subtotalCalculado - (descuento || 0);

    // Registra el presupuesto y sus servicios asociados en la base de datos
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

// Obtiene todos los presupuestos excluyendo aquellos con estado inactivo
const obtenerPresupuestos = async (req, res) => {
  try {
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

    // Busca el registro en la base de datos para verificar su existencia
    const presupuestoExistente = await prisma.presupuesto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!presupuestoExistente) {
      return res.status(404).json({ mensaje: "El presupuesto solicitado no existe" });
    }

    if (presupuestoExistente.estado === "ACEPTADO") {
      return res.status(400).json({ mensaje: "No es posible eliminar un presupuesto que ya ha sido aceptado" });
    }

    // Actualiza el estado del registro a inactivo en lugar de borrarlo físicamente
    const presupuestoEliminado = await prisma.presupuesto.update({
      where: { id: parseInt(id) },
      data: { estado: "INACTIVO" }
    });

    res.status(200).json({ mensaje: "Presupuesto archivado correctamente", presupuestoEliminado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al intentar eliminar el presupuesto" });
  }
};

module.exports = { crearPresupuesto, obtenerPresupuestos, eliminarPresupuesto };