const servicioService = require("../services/servicio.service");

const getAll = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.usuario.rol === "ADMIN" && req.validated.query?.incluirInactivos === true;

        const servicios = await servicioService.getAll(incluirInactivos);

        return res.status(200).json(servicios);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const servicio = await servicioService.getById(req.validated.params.id);
        return res.status(200).json(servicio);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const servicio = await servicioService.create(req.body);
        return res.status(201).json(servicio);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const servicio = await servicioService.update(
            req.validated.params.id,
            req.body
        );

        return res.status(200).json(servicio);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const servicio = await servicioService.remove(req.validated.params.id);
        return res.status(200).json(servicio);
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const servicio = await servicioService.reactivate(req.validated.params.id);
        return res.status(200).json(servicio);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    reactivate
};