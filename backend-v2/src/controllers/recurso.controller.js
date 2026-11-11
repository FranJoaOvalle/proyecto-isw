const recursoService = require("../services/recurso.service");

const responder = (accion, status = 200) => async (req, res, next) => {
    try {
        return res.status(status).json(await accion(req));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll: responder(req => {
        const query = req.validated.query;
        return recursoService.getAll(
            query?.incluirInactivos === true,
            query?.inicio && query?.fin ? query : null
        );
    }),
    getCotizables: responder(() => recursoService.getCotizables()),
    getById: responder(req => recursoService.getById(req.validated.params.id)),
    create: responder(req => recursoService.create(req.validated.body), 201),
    update: responder(req => recursoService.update(
        req.validated.params.id,
        req.validated.body
    )),
    cambiarEstado: responder(req => recursoService.cambiarEstado(
        req.validated.params.id,
        req.validated.body.activo
    )),
    eliminar: responder(req => recursoService.eliminar(req.validated.params.id)),
    reservas: responder(req => recursoService.getReservas(req.validated.params.id)),
    reservar: responder(req => recursoService.reservar(
        req.validated.params.id,
        req.validated.body
    ), 201),
    cancelarReserva: responder(req => recursoService.cancelarReserva(req.validated.params.id)),
    registrarDevolucion: responder(req => recursoService.registrarDevolucion(
        req.validated.params.id,
        req.validated.params.reservaId,
        req.validated.body
    ))
};
