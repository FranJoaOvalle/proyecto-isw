const jwt = require("jsonwebtoken");

const UnauthorizedException = require("../exceptions/UnauthorizedException");

/**
 * @function
 *
 * @description
 * Middleware encargado de autenticar las solicitudes mediante un
 * token JWT enviado en el encabezado `Authorization`.
 *
 * El middleware espera que el encabezado tenga el siguiente formato:
 *
 * `Authorization: Bearer <token>`
 *
 * Si el token es válido, extrae la información necesaria del payload
 * y la almacena en `req.usuario` para que pueda ser utilizada por los
 * siguientes middlewares, controladores o servicios.
 *
 * La solicitud es rechazada cuando:
 *
 * - No se proporciona el encabezado `Authorization`.
 * - El encabezado no utiliza el formato `Bearer <token>`.
 * - El token es inválido.
 * - El token ha expirado.
 *
 * Los errores de autenticación se convierten en `UnauthorizedException`
 * y son enviados al middleware global `errorHandler`.
 *
 * @param {import("express").Request} req
 * Solicitud HTTP que contiene el token JWT en el encabezado
 * `Authorization`.
 *
 * @param {import("express").Response} res
 * Respuesta HTTP de la solicitud.
 *
 * @param {import("express").NextFunction} next
 * Función proporcionada por Express para continuar con el siguiente
 * middleware cuando la autenticación es exitosa, o para transferir
 * un error al middleware global de manejo de errores.
 *
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(
                new UnauthorizedException(
                    "Token no proporcionado."
                )
            );
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1])
            return next(new UnauthorizedException("Formato de token inválido."));

        const token = parts[1];

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = {
            id_usuario: payload.id_usuario,
            rol: payload.rol
        };

        next();

    } catch (error) {
        return next(
            new UnauthorizedException(
                "Token inválido o expirado."
            )
        );
    }
};

module.exports = authMiddleware;