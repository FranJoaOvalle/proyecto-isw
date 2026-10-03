const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

const UnauthorizedException = require("../exceptions/UnauthorizedException");
const NotFoundException = require("../exceptions/NotFoundException");
const ConflictException = require("../exceptions/ConflictException");
const BadRequestException = require("../exceptions/BadRequestException");
const prismaExceptionHandler = require("../utils/prismaExceptionHandler");

const obtenerPerfil = async (usuarioId) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
            id: true,
            email: true,
            rol: true,
            activo: true,
            cliente: {
                include: {
                    persona: true,
                    empresa: true
                }
            },
            productor: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!usuario) throw new NotFoundException("Usuario no encontrado.");
    return usuario;
};

const actualizarPerfil = async (usuarioId, data) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
            cliente: {
                include: {
                    persona: true,
                    empresa: true
                }
            },
            productor: true
        }
    });

    if (!usuario) throw new NotFoundException("Usuario no encontrado.");

    const permitidos = {
        ADMIN: ["email"],
        PRODUCTOR: ["email", "nombres", "apellidos", "telefono"],
        CLIENTE_PERSONA: ["email", "nombres", "apellidos", "telefono"],
        CLIENTE_EMPRESA: ["email", "razonSocial", "casaMatriz", "telefono"]
    };

    let perfil;

    if (usuario.rol === "ADMIN") perfil = "ADMIN";
    else if (usuario.rol === "PRODUCTOR") perfil = "PRODUCTOR";
    else if (usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "PERSONA") perfil = "CLIENTE_PERSONA";
    else if (usuario.rol === "CLIENTE" && usuario.cliente?.tipo === "EMPRESA") perfil = "CLIENTE_EMPRESA";
    else throw new BadRequestException("El perfil del usuario no es válido.");

    const camposInvalidos = Object.keys(data).filter((campo) => !permitidos[perfil].includes(campo));
    if (camposInvalidos.length)
        throw new BadRequestException(`No puedes modificar: ${camposInvalidos.join(", ")}.`);

    if (data.email && data.email !== usuario.email) {
        const existente = await prisma.usuario.findUnique({ where: { email: data.email } });
        if (existente) throw new ConflictException("Ya existe un usuario registrado con este correo.");
    }

    try {
        await prisma.$transaction(async (tx) => {
            if (data.email) {
                await tx.usuario.update({
                    where: { id: usuarioId },
                    data: { email: data.email }
                });
            }

            if (perfil === "PRODUCTOR") {
                await tx.productor.update({
                    where: { usuarioId },
                    data: {
                        nombres: data.nombres,
                        apellidos: data.apellidos,
                        telefono: data.telefono
                    }
                });
            }

            if (perfil === "CLIENTE_PERSONA") {
                await tx.clientePersona.update({
                    where: { clienteId: usuario.cliente.id },
                    data: {
                        nombres: data.nombres,
                        apellidos: data.apellidos,
                        telefono: data.telefono
                    }
                });
            }

            if (perfil === "CLIENTE_EMPRESA") {
                await tx.clienteEmpresa.update({
                    where: { clienteId: usuario.cliente.id },
                    data: {
                        razonSocial: data.razonSocial,
                        casaMatriz: data.casaMatriz,
                        telefono: data.telefono
                    }
                });
            }
        });

        return obtenerPerfil(usuarioId);
    } catch (error) {
        prismaExceptionHandler(error);
        throw error;
    }
};

const cambiarPassword = async (usuarioId, passwordActual, passwordNueva) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException("Usuario no encontrado.");

    const valida = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!valida) throw new UnauthorizedException("La contraseña actual es incorrecta.");

    const mismaPassword = await bcrypt.compare(passwordNueva, usuario.passwordHash);
    if (mismaPassword) throw new BadRequestException("La nueva contraseña debe ser distinta a la actual.");

    const passwordHash = await bcrypt.hash(passwordNueva, 12);

    await prisma.usuario.update({
        where: { id: usuarioId },
        data: { passwordHash }
    });
};

const desactivarCuenta = async (usuarioId) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException("Usuario no encontrado.");
    if (!usuario.activo) throw new BadRequestException("La cuenta ya está desactivada.");

    await prisma.usuario.update({
        where: { id: usuarioId },
        data: { activo: false }
    });
};

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    desactivarCuenta
};