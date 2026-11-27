const service =
    require("../services/evaluacion-productor.service");
const envioEncuesta = require("../services/envio-encuesta.service");

const reenviarEncuesta = async (req, res, next) => {
    try {
        const resultado = await envioEncuesta.enviar(req.validated.params.id, {
            manual: true, confirmacion: req.validated.body.confirmacion
        });
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

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
    reenviarEncuesta,
    listarEventos,
    consultarEvento,
    crear,
    historialProductor
};
