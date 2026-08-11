const UnauthorizedException = require("../exceptions/UnauthorizedException");
const ForbiddenException = require("../exceptions/ForbiddenException");

/**
 * @function authorize
 *
 * @description
 * Middleware encargado de verificar que el usuario autenticado
 * tenga uno de los roles necesarios para realizar una operación.
 *
 * Debe utilizarse después de `authMiddleware`, ya que depende de
 * la información almacenada en `req.usuario`.
 *
 * Si el usuario no está autenticado, se genera una excepción
 * `UnauthorizedException`.
 *
 * Si el usuario está autenticado, pero su rol no está permitido,
 * se genera una excepción `ForbiddenException`.
 *
 * @param {...string} rolesPermitidos
 * Roles que tienen permiso para realizar la operación.
 *
 * @returns {import("express").RequestHandler}
 * Middleware de Express encargado de verificar los permisos
 * del usuario.
 *
 * @example
 * router.delete(
 *     "/users/:id",
 *     authMiddleware,
 *     authorize("ADMIN"),
 *     deleteUser
 * );
 */
const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return next(
                new UnauthorizedException(
                    "Usuario no autenticado."
                )
            );
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return next(
                new ForbiddenException(
                    "No tiene permisos para realizar esta acción."
                )
            );
        }

        next();
    };
};

module.exports = authorize;