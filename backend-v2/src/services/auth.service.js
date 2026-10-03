const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const env = require("../config/env");
const ConflictException = require("../exceptions/ConflictException");
const UnauthorizedException = require("../exceptions/UnauthorizedException");
const prismaExceptionHandler = require("../utils/prismaExceptionHandler");

const SALT_ROUNDS = 12;

const registrarCliente = async (data) => {
    const {
        tipo,
        email,
        password,
        telefono
    } = data;

    const usuarioExistente = await prisma.usuario.findUnique({
        where: { email }
    });

    if (usuarioExistente) throw new ConflictException("Ya existe un usuario registrado con este correo.");

    if (tipo === "PERSONA") {
        const personaExistente =
            await prisma.clientePersona.findUnique({
            where: { rut: data.rut }
        });

        if (personaExistente)
            throw new ConflictException("Ya existe un cliente registrado con este RUT.");
    }

    if (tipo === "EMPRESA") {
        const empresaExistente = await prisma.clienteEmpresa.findUnique({
            where: { rutEmpresa: data.rutEmpresa }
        });

        if (empresaExistente)
            throw new ConflictException("Ya existe una empresa registrada con este RUT.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
        return await prisma.$transaction(async (tx) => {
            const usuario = await tx.usuario.create({
                data: {
                    email,
                    passwordHash,
                    rol: "CLIENTE"
                }
            });

            const cliente = await tx.cliente.create({
                data: {
                    usuarioId: usuario.id,
                    tipo
                }
            });

            if (tipo === "PERSONA") {
                await tx.clientePersona.create({
                    data: {
                        clienteId: cliente.id,
                        rut: data.rut,
                        nombres: data.nombres,
                        apellidos: data.apellidos,
                        telefono
                    }
                });
            }

            if (tipo === "EMPRESA") {
                await tx.clienteEmpresa.create({
                    data: {
                        clienteId: cliente.id,
                        rutEmpresa: data.rutEmpresa,
                        razonSocial: data.razonSocial,
                        casaMatriz: data.casaMatriz,
                        telefono
                    }
                });
            }

            return {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol,
                tipo: cliente.tipo
            };
        });
    } catch (error) {
        const prismaError = prismaExceptionHandler(error);
        if (prismaError) throw prismaError;
        throw error;
    }
};

const login = async ({ email, password }) => {
    const usuario = await prisma.usuario.findUnique({
        where: { email }
    });

    if (!usuario) throw new UnauthorizedException("Credenciales incorrectas.");

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) throw new UnauthorizedException("Credenciales incorrectas.");
    if (!usuario.activo) throw new UnauthorizedException("Cuenta desactivada.");

    const token = jwt.sign(
        { id_usuario: usuario.id },
        env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        }
    };
};

module.exports = {
    registrarCliente,
    login
};