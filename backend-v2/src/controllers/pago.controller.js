const service = require("../services/pago.service");

const listar = async (req, res, next) => {
    try {
        const pagos = await service.listar(req.validated.query);
        return res.status(200).json(pagos);
    } catch (error) {
        return next(error);
    }
};

const registrar = async (req, res, next) => {
    try {
        const pago = await service.registrar({ ...req.validated.body, usuarioId: req.usuario.id });
        return res.status(201).json(pago);
    } catch (error) { return next(error); }
};

const confirmar = async (req, res, next) => {
    try {
        const pago = await service.confirmar({
            ...req.validated.body,
            id: req.validated.params.id,
            usuarioId: req.usuario.id
        });
        return res.status(200).json(pago);
    } catch (error) { return next(error); }
};

const enviarEncuesta = async (req, res, next) => {
    try {
        const encuesta = await service.enviarEncuesta(req.validated.params.id, req.usuario.id);
        return res.status(200).json(encuesta);
    } catch (error) { return next(error); }
};

module.exports = { listar, registrar, confirmar, enviarEncuesta };
