const service = require("../services/presupuesto.service");

const responder = (accion, status = 200) => async (req, res, next) => {
    try {
        res.status(status).json(await accion(req));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll: responder((req) => service.getAll(req.usuario)),
    getById: responder((req) => service.consultar(req.validated.params.id, req.usuario)),
    create: responder(
        (req) => service.create(req.validated.body, req.usuario.id),
        201
    ),
    update: responder((req) =>
        service.update(req.validated.params.id, req.validated.body, req.usuario.id)
    ),
    cancelar: responder((req) =>
        service.cancelar(req.validated.params.id, req.usuario.id)
    ),
    enviar: responder((req) =>
        service.enviar(req.validated.params.id, req.validated.body, req.usuario.id)
    ),
    aceptar: responder((req) =>
        service.aceptar(req.validated.params.id, req.validated.body, req.usuario)
    )
};
