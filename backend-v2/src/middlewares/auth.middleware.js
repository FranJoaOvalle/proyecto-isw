const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const UnauthorizedException = require("../exceptions/UnauthorizedException");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException("Token no proporcionado.");

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token)
        throw new UnauthorizedException("Formato de token inválido.");

    let payload;

    try {
        payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
        throw new UnauthorizedException("Token inválido o expirado.");
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id_usuario }
    });

    if (!usuario) throw new UnauthorizedException("Usuario no encontrado.");
    if (!usuario.activo) throw new UnauthorizedException("Cuenta desactivada.");

    req.usuario = {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
    };

    next();
};

module.exports = authMiddleware;