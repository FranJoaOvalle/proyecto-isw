const vehiculoService = require("../services/vehiculo.service");

const responder = (accion, status = 200) => async (req, res, next) => {
    try {
        return res.status(status).json(await accion(req));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll: responder(req => vehiculoService.getAll(req.validated.query)),
    getById: responder(req => vehiculoService.getById(req.validated.params.id)),
    create: responder(req => vehiculoService.create(req.validated.body), 201),
    update: responder(req => vehiculoService.update(req.validated.params.id, req.validated.body)),
    reservas: responder(req => vehiculoService.getReservas(req.validated.params.id)),
    reservar: responder(req => vehiculoService.reservar(req.validated.params.id, req.validated.body), 201),
    cancelarReserva: responder(req => vehiculoService.cancelarReserva(req.validated.params.id)),
    registrarDevolucion: responder(req => vehiculoService.registrarDevolucion(
        req.validated.params.id,
        req.validated.params.reservaId,
        req.validated.body
    ))
};
