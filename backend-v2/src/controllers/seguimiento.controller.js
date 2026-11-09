const SeguimientoService = require("../services/seguimiento.service");
const EventoService = require("../services/evento.service");

const editarEvento = async (req, res, next) => {
    try {
        const resultado = await EventoService.actualizar(
            req.validated.params.id,
            req.validated.body,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const cancelarEvento = async (req, res, next) => {
    try {
        const resultado = await EventoService.cancelar(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const eliminarEvento = async (req, res, next) => {
    try {
        const resultado = await EventoService.eliminar(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const eventos = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.eventos(
            req.validated.query,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const evento = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.evento(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const historial = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.historial(
            req.validated.params.id,
            req.validated.query,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const autores = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.autores(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const crear = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.crear(
            req.validated.params.id,
            req.validated.body,
            req.usuario
        );

        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const registro = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.registro(
            req.validated.params.id,
            req.validated.params.seguimientoId,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const comentarios = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.comentarios(
            req.validated.params.id,
            req.validated.params.seguimientoId,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const comentar = async (req, res, next) => {
    try {
        const resultado = await SeguimientoService.comentar(
            req.validated.params.id,
            req.validated.params.seguimientoId,
            req.validated.body,
            req.usuario
        );

        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    editarEvento,
    cancelarEvento,
    eliminarEvento,
    eventos,
    evento,
    historial,
    autores,
    crear,
    registro,
    comentarios,
    comentar
};
