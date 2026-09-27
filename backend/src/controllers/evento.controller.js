const eventoService = require('../services/evento.service.js');

const createEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.createEvento(req.body);
    res.status(201).json({ message: 'Evento registrado con éxito', data: evento });
  } catch (error) {
    next(error);
  }
};

const getEventos = async (req, res, next) => {
  try {
    const eventos = await eventoService.getAllEventos();
    res.status(200).json({ data: eventos });
  } catch (error) {
    next(error);
  }
};

const getEventoById = async (req, res, next) => {
  try {
    const evento = await eventoService.getEventoById(Number(req.params.id));
    res.status(200).json({ data: evento });
  } catch (error) {
    next(error);
  }
};

const updateEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.updateEvento(Number(req.params.id), req.body);
    res.status(200).json({ message: 'Evento actualizado', data: evento });
  } catch (error) {
    next(error);
  }
};

const cancelarEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.cancelarEvento(Number(req.params.id));
    res.status(200).json({ message: 'Evento cancelado exitosamente.', data: evento });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvento,
  getEventos,
  getEventoById,
  updateEvento,
  cancelarEvento
};