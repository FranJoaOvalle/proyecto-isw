const ActividadService = require("../services/actividad.service");

const getAll = async (req, res, next) => {
    try {
        const filtros = req.validated.query || {};

        const actividades = await ActividadService.getAll(filtros);

        return res.status(200).json(actividades);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const actividad = await ActividadService.getById(
            req.validated.params.id
        );

        return res.status(200).json(actividad);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const actividad = await ActividadService.create(
            req.validated.body
        );

        return res.status(201).json(actividad);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const actividad = await ActividadService.update(
            req.validated.params.id,
            req.validated.body
        );

        return res.status(200).json(actividad);
    } catch (error) {
        next(error);
    }
};

const cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const { estado } = req.validated.body;

        const actividad = await ActividadService.changeStatus(
            id,
            estado
        );

        return res.status(200).json(actividad);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const actividad = await ActividadService.remove(
            req.validated.params.id
        );

        return res.status(200).json(actividad);
    } catch (error) {
        next(error);
    }
};

const removePhysical = async (req, res, next) => {
    try {
        const actividad = await ActividadService.removePhysical(
            req.validated.params.id
        );

        return res.status(200).json(actividad);
    } catch (error) {
        next(error);
    }
};

const getAgenda = async (req, res, next) => {
    try {
        const filtros = req.validated.query || {};

        const agenda = await ActividadService.getAgenda(filtros);

        return res.status(200).json(agenda);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    cambiarEstado,
    remove,
    removePhysical,
    getAgenda
};