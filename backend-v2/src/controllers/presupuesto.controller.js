const service = require("../services/presupuesto.service");

const responder = (accion, status = 200) => async (req, res, next) => {
    try {
        res.status(status).json(await accion(req));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll: responder(() => service.getAll()),
    getById: responder((req) => service.getById(req.validated.params.id)),
    create: responder(
        (req) => service.create(req.validated.body, req.usuario.id),
        201
    ),
    update: responder((req) =>
        service.update(req.validated.params.id, req.validated.body, req.usuario.id)
    ),
    cancelar: responder((req) =>
        service.cancelar(req.validated.params.id, req.usuario.id)
    )
};
