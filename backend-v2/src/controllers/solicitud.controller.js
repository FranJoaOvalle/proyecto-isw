const servicio = require("../services/solicitud.service");
const responder = (accion, status = 200) => async (req, res, next) => {
    try { res.status(status).json(await accion(req.validated, req.usuario)); }
    catch (error) { next(error); }
};
module.exports = {
    crear: responder((v, u) => servicio.crear(v.body, u), 201),
    listar: responder((v, u) => servicio.listar(v.query, u)),
    detalle: responder((v, u) => servicio.detalle(v.params.id, u)),
    historial: responder((v, u) => servicio.historial(v.params.id, u)),
    editar: responder((v, u) => servicio.editar(v.params.id, v.body, u)),
    revisar: responder((v, u) => servicio.revisar(v.params.id, u)),
    rechazar: responder((v, u) => servicio.cerrar(v.params.id, v.body.motivo, u)),
    retirar: responder((v, u) => servicio.cerrar(v.params.id, v.body.motivo, u, true))
};
