const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const ConflictException = require("../exceptions/ConflictException");
const prismaExceptionHandler = require("../utils/prismaExceptionHandler");

const SALT_ROUNDS = 12;

const crearProductor = async (data) => {
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (usuarioExistente) throw new ConflictException("Ya existe un usuario registrado con este correo.");

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    try {
        return await prisma.$transaction(async (tx) => {
            const usuario = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash,
                    rol: "PRODUCTOR"
                }
            });

            const productor = await tx.productor.create({
                data: {
                    usuarioId: usuario.id,
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    telefono: data.telefono
                }
            });

            return {
                id: productor.id,
                nombres: productor.nombres,
                apellidos: productor.apellidos,
                telefono: productor.telefono,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    rol: usuario.rol,
                    activo: usuario.activo
                }
            };
        });
    } catch (error) {
        prismaExceptionHandler(error);
        throw error;
    }
};

const listarProductores = async () => {
    return prisma.productor.findMany({
        orderBy: { id: "asc" },
        include: {
            usuario: {
                select: {
                    id: true,
                    email: true,
                    rol: true,
                    activo: true
                }
            }
        }
    });
};

const NotFoundException = require("../exceptions/NotFoundException");

const obtenerProductor = async (id) => {
    const productor = await prisma.productor.findUnique({
        where: { id },
        include: {
            usuario: {
                select: {
                    id: true,
                    email: true,
                    rol: true,
                    activo: true
                }
            }
        }
    });

    if (!productor) throw new NotFoundException("Productor no encontrado.");
    return productor;
};

const actualizarProductor = async (id, data) => {
    const productor = await prisma.productor.findUnique({
        where: { id },
        include: { usuario: true }
    });

    if (!productor) throw new NotFoundException("Productor no encontrado.");

    if (data.email && data.email !== productor.usuario.email) {
        const existente = await prisma.usuario.findUnique({
            where: { email: data.email }
        });

        if (existente) throw new ConflictException("Ya existe un usuario registrado con este correo.");
    }

    try {
        return await prisma.$transaction(async (tx) => {
            if (data.email) {
                await tx.usuario.update({
                    where: { id: productor.usuarioId },
                    data: { email: data.email }
                });
            }

            return tx.productor.update({
                where: {id},
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    telefono: data.telefono
                },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            rol: true,
                            activo: true
                        }
                    }
                }
            });
        });
    } catch (error) {
        prismaExceptionHandler(error);
        throw error;
    }
};

const cambiarEstadoProductor = async (id, activo) => {
    const productor = await prisma.productor.findUnique({
        where: { id },
        include: { usuario: true }
    });

    if (!productor) throw new NotFoundException("Productor no encontrado.");

    if (productor.usuario.activo === activo)
        return productor;

    await prisma.usuario.update({
        where: { id: productor.usuarioId },
        data: { activo }
    });

    return obtenerProductor(id);
};

module.exports = {
    crearProductor,
    listarProductores,
    obtenerProductor,
    actualizarProductor,
    cambiarEstadoProductor
};