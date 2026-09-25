const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../db/prisma");

const UnauthorizedException = require("../exceptions/UnauthorizedException");

class AuthService {
    /**
     * Autentica un usuario mediante correo electrónico y contraseña.
     *
     * @param {string} email
     * @param {string} password
     *
     * @returns {Promise<{
     *     token: string,
     *     usuario: {
     *         id_usuario: number,
     *         email: string,
     *         rol: string
     *     }
     * }>}
     */
    async login(email, password) {
        const usuario = await prisma.usuario.findUnique({
            where: {
                email
            }
        });

        if (!usuario || !usuario.activo) throw new UnauthorizedException("Credenciales incorrectas.");

        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValida) throw new UnauthorizedException("Credenciales incorrectas.");

        const token = jwt.sign(
            {
                id_usuario: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN ?? "8h"
            }
        );

        return {
            token,
            usuario: {
                id_usuario: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            }
        };
    }
}

module.exports = new AuthService();