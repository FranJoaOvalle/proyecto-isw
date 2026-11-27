const EncuestaService = require("../services/encuesta.service");

const getAll = async (req, res, next) => {
    try {
        const { tipo } = req.validated.query;

        const encuestas = await EncuestaService.getAll(tipo);

        return res.status(200).json(encuestas);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const encuesta = await EncuestaService.getById(
            req.validated.params.id
        );

        return res.status(200).json(encuesta);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const encuesta = await EncuestaService.create(
            req.validated.body
        );

        return res.status(201).json(encuesta);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const encuesta = await EncuestaService.update(
            req.validated.params.id,
            req.validated.body
        );

        return res.status(200).json(encuesta);
    } catch (error) {
        next(error);
    }
};

const cambiarEstado = async (req, res, next) => {
    try {
        const encuesta = await EncuestaService.cambiarEstado(
            req.validated.params.id,
            req.validated.body.activo
        );

        return res.status(200).json(encuesta);
    } catch (error) {
        next(error);
    }
};

const establecerPredeterminada = async (req, res, next) => {
    try {
        const resultado =
            await EncuestaService.establecerPredeterminada(
                req.validated.params.id
            );

        return res.status(200).json(resultado);
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
    establecerPredeterminada
};