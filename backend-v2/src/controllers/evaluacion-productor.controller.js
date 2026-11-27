const service =
    require("../services/evaluacion-productor.service");

const listarEventos = async (req, res, next) => {
    try {
        const eventos = await service.listarEventos();

        return res.status(200).json(eventos);
    } catch (error) {
        next(error);
    }
};

const consultarEvento = async (req, res, next) => {
    try {
        const resultado = await service.consultarEvento(
            req.validated.params.id
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const crear = async (req, res, next) => {
    try {
        const evaluacion = await service.crear(
            req.validated.params.id,
            req.usuario.id,
            req.validated.body
        );

        return res.status(201).json(evaluacion);
    } catch (error) {
        next(error);
    }
};

const historialProductor = async (req, res, next) => {
    try {
        const resultado = await service.historialProductor(
            req.validated.params.id
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listarEventos,
    consultarEvento,
    crear,
    historialProductor
};