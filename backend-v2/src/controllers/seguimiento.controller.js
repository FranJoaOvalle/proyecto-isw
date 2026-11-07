const service = require("../services/seguimiento.service");

const responder = (accion, status = 200) => async (req, res, next) => {
    try {
        res.status(status).json(await accion(req.validated, req.usuario));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    eventos: responder((v, u) => service.eventos(v.query, u)),
    evento: responder((v, u) => service.evento(v.params.id, u)),
    historial: responder((v, u) => service.historial(v.params.id, v.query, u)),
    autores: responder((v, u) => service.autores(v.params.id, u)),
    crear: responder((v, u) => service.crear(v.params.id, v.body, u), 201),
    registro: responder((v, u) => service.registro(v.params.id, v.params.seguimientoId, u)),
    comentarios: responder((v, u) => service.comentarios(v.params.id, v.params.seguimientoId, u)),
    comentar: responder((v, u) => service.comentar(v.params.id, v.params.seguimientoId, v.body, u), 201)
};
