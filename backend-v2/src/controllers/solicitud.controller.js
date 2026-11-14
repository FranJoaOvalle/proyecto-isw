const SolicitudService = require("../services/solicitud.service");

const crear = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.crear(
            req.validated.body,
            req.usuario
        );

        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const listar = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.listar(
            req.validated.query,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const detalle = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.detalle(
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
        const resultado = await SolicitudService.historial(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const editar = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.editar(
            req.validated.params.id,
            req.validated.body,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const revisar = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.revisar(
            req.validated.params.id,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const rechazar = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.cerrar(
            req.validated.params.id,
            req.validated.body.motivo,
            req.usuario
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const retirar = async (req, res, next) => {
    try {
        const resultado = await SolicitudService.cerrar(
            req.validated.params.id,
            req.validated.body.motivo,
            req.usuario,
            true
        );

        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crear,
    listar,
    detalle,
    historial,
    editar,
    revisar,
    rechazar,
    retirar
};
