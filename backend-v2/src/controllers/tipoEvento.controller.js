const TipoEventoService = require("../services/tipoEvento.service");

const getAll = async (req, res, next) => {
    try {
        const tipoEventos = await TipoEventoService.getAll(false);

        return res.status(200).json(tipoEventos);
    } catch (error) {
        next(error);
    }
};

const getAllAdmin = async (req, res, next) => {
    try {
        const incluirInactivos =
            req.validated.query?.incluirInactivos === true;

        const tipoEventos = await TipoEventoService.getAll(
            incluirInactivos
        );

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
        const tipoEvento = await TipoEventoService.create(
            req.validated.body
        );

        return res.status(201).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const tipoEvento = await TipoEventoService.update(
            req.validated.params.id,
            req.validated.body
        );

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

const cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.validated.params;
        const { activo } = req.validated.body;

        const tipoEvento = activo
            ? await TipoEventoService.reactivate(id)
            : await TipoEventoService.remove(id);

        return res.status(200).json(tipoEvento);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getAllAdmin,
    getById,
    create,
    update,
    cambiarEstado
};