const TipoEventoService = require("../services/tipoEvento.service");

const getAll = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.usuario.rol === "ADMIN" &&
            req.validated.query?.incluirInactivos === true;

        const tipoEventos = await TipoEventoService.getAll(incluirInactivos);

        return res.status(200).json(tipoEventos);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.getById(
            req.validated.params.id
        );

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.create(req.body);
        return res.status(201).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.update(
            req.validated.params.id,
            req.body
        );

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.remove(
            req.validated.params.id
        );

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.reactivate(
            req.validated.params.id
        );

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const removePhysical = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.removePhysical(
            req.validated.params.id
        );

        return res.status(200).json({
            mensaje: "Tipo de evento eliminado físicamente.",
            tipoEvento
        });
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
    reactivate,
    removePhysical
};