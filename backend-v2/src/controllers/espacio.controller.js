const espacioService = require("../services/espacio.service");

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
        return espacioService.getAll(query?.inicio && query?.fin ? query : null);
    }),
    create: responder(req => espacioService.create(req.validated.body), 201),
    update: responder(req => espacioService.update(
        req.validated.params.id,
        req.validated.body
    )),
    cambiarEstado: responder(req => espacioService.cambiarEstado(
        req.validated.params.id,
        req.validated.body.habilitado
    )),
    eliminar: responder(req => espacioService.eliminar(req.validated.params.id)),
    guardarUbicacion: responder(req => espacioService.guardarUbicacion(
        req.validated.params.id,
        req.validated.body
    )),
    reservas: responder(req => espacioService.getReservas(req.validated.params.id)),
    reservar: responder(req => espacioService.reservar(
        req.validated.params.id,
        req.validated.body,
        req.usuario
    ), 201),
    cancelarReserva: responder(req => espacioService.cancelarReserva(
        req.validated.params.id
    ))
};
