const service = require("../services/espacio.service");
const responder = (accion, status = 200) => async (req, res, next) => {
    try { res.status(status).json(await accion(req)); } catch (error) { next(error); }
};
module.exports = {
    getAll: responder(() => service.getAll()),
    disponibilidad: responder(req => service.getAll(req.validated.query)),
    create: responder(req => service.create(req.validated.body), 201),
    update: responder(req => service.update(req.validated.params.id, req.validated.body)),
    reservas: responder(req => service.getReservas(req.validated.params.id)),
    reservar: responder(req => service.reservar(req.validated.params.id, req.validated.body), 201),
    cancelar: responder(req => service.cancelar(req.validated.params.id))
};
