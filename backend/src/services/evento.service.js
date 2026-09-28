const prisma = require('../db/prisma.js');
const NotFoundException = require('../exceptions/NotFoundException.js');
const BadRequestException = require('../exceptions/BadRequestException.js');

const createEvento = async (data) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: data.clienteId, activo: true }
  });

  if (!cliente) {
    throw new NotFoundException('El cliente asociado no existe o está inactivo');
  }

  return await prisma.evento.create({
    data: {
      ...data,
      estado: data.estado || 'ORGANIZACION',
    }
  });
};

const getAllEventos = async (usuarioActual) => {
  const whereClause = { activo: true };

  if (usuarioActual && usuarioActual.rol === 'CLIENTE') {
      whereClause.cliente = {
          usuarioId: usuarioActual.id
      };
  }
  return await prisma.evento.findMany({
    where: whereClause,
    include: { 
      cliente: true,
      personalAsignado: { include: { personal: true } },
      recursosAsignados: { include: { recurso: true } },
      serviciosAsignados: { include: { servicio: true } }
    }
  });
};

const getEventoById = async (id) => {
  const evento = await prisma.evento.findUnique({
    where: { id },
    include: { 
      cliente: true,
      personalAsignado: { include: { personal: true } },
      recursosAsignados: { include: { recurso: true } },
      serviciosAsignados: { include: { servicio: true } }
    }
  });

  if (!evento) {
    throw new NotFoundException('Evento no encontrado en la base de datos');
  }
  return evento;
};

const cancelarEvento = async (id) => {
  const evento = await getEventoById(id);
  
  if (evento.estado === 'CANCELADO') {
    throw new BadRequestException('El evento ya se encuentra cancelado');
  }

  return await prisma.evento.update({
    where: { id },
    data: { estado: 'CANCELADO' } 
  });
};

const updateEvento = async (id, updateData) => {
  const eventoExistente = await prisma.evento.findUnique({
      where: { id: Number(id) }
  });

  if (!eventoExistente) {
      throw new NotFoundException("El evento especificado no existe.");
  }

  const dataToUpdate = { ...updateData };
  if (dataToUpdate.fecha) {
      dataToUpdate.fecha = new Date(dataToUpdate.fecha);
  }

  return await prisma.evento.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      include: { 
          cliente: true 
      }
  });
};

module.exports = {
  createEvento,
  getAllEventos,
  getEventoById,
  updateEvento,
  cancelarEvento,
};