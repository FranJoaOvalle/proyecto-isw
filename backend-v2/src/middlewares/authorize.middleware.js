const ForbiddenException = require("../exceptions/ForbiddenException");

const authorize = (...rolesPermitidos) => (req, res, next) => {
    if (!req.usuario)
        throw new ForbiddenException("No se pudo determinar el usuario autenticado.");

    if (!rolesPermitidos.includes(req.usuario.rol))
        throw new ForbiddenException("No tienes permisos para realizar esta acción.");

    next();
};

module.exports = authorize;