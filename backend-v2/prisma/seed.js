require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

const PASSWORD_PRUEBA = "Prueba123!";

const fecha = (value) => new Date(value);
const dinero = (value) => Number(value).toFixed(2);

const wipeDatabase = async () => {
    console.log("Limpiando base de datos...");

    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            "EventoCambio",
            "Calificacion",
            "EventoRecurso",
            "Evento",
            "Pago",
            "PresupuestoRecurso",
            "Presupuesto",
            "RecursoHumano",
            "RecursoMaterial",
            "Recurso",
            "TipoEvento",
            "Productor",
            "ClienteEmpresa",
            "ClientePersona",
            "Cliente",
            "Usuario"
        RESTART IDENTITY CASCADE
    `);

    console.log("Base de datos limpia.");
};

const crearClientePersona = async (passwordHash, numero, data) => {
    const usuario = await prisma.usuario.create({
        data: {
            email: `cliente${numero}.prueba@nes.cl`,
            passwordHash,
            rol: "CLIENTE",
            activo: true,
            cliente: {
                create: {
                    tipo: "PERSONA",
                    persona: {
                        create: data
                    }
                }
            }
        },
        include: {
            cliente: true
        }
    });

    return {
        usuario,
        cliente: usuario.cliente
    };
};

const crearClienteEmpresa = async (passwordHash, numero, data) => {
    const usuario = await prisma.usuario.create({
        data: {
            email: `cliente${numero}.prueba@nes.cl`,
            passwordHash,
            rol: "CLIENTE",
            activo: true,
            cliente: {
                create: {
                    tipo: "EMPRESA",
                    empresa: {
                        create: data
                    }
                }
            }
        },
        include: {
            cliente: true
        }
    });

    return {
        usuario,
        cliente: usuario.cliente
    };
};

const crearProductor = async (passwordHash, numero, data) => {
    const usuario = await prisma.usuario.create({
        data: {
            email: `productor${numero}.prueba@nes.cl`,
            passwordHash,
            rol: "PRODUCTOR",
            activo: true,
            productor: {
                create: data
            }
        },
        include: {
            productor: true
        }
    });

    return {
        usuario,
        productor: usuario.productor
    };
};

const crearRecursoMaterial = (data) =>
    prisma.recurso.create({
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            tipo: "MATERIAL",
            precioUnitario: data.precioUnitario,
            stockTotal: data.stockTotal,
            activo: data.activo ?? true,
            material: {
                create: {
                    unidad: data.unidad
                }
            }
        }
    });

const crearRecursoHumano = (data) =>
    prisma.recurso.create({
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            tipo: "HUMANO",
            precioUnitario: data.precioUnitario,
            stockTotal: data.stockTotal,
            activo: data.activo ?? true,
            humano: {
                create: {
                    origen: data.origen
                }
            }
        }
    });

const crearPresupuesto = async ({
    cliente,
    tipoEvento,
    inicio,
    fin,
    lugar,
    asistentes,
    venceAt,
    estado,
    recursos,
    recargoClientePct = 0.05,
    porcentajeAnticipo = 30,
    createdAt
}) => {
    const precioBase = Number(tipoEvento.precioBase);

    const recursosSnapshot = recursos.map(({ recurso, cantidad }) => {
        const precioUnitario = Number(recurso.precioUnitario);

        return {
            recursoId: recurso.id,
            nombreRecurso: recurso.nombre,
            tipoRecurso: recurso.tipo,
            cantidad,
            precioUnitario: dinero(precioUnitario),
            subtotal: dinero(precioUnitario * cantidad)
        };
    });

    const subtotalRecursos = recursosSnapshot.reduce(
        (total, recurso) => total + Number(recurso.subtotal),
        0
    );

    const subtotal = precioBase + subtotalRecursos;
    const recargoCliente = subtotal * recargoClientePct;
    const total = subtotal + recargoCliente;
    const montoAnticipo = total * (porcentajeAnticipo / 100);

    return prisma.presupuesto.create({
        data: {
            clienteId: cliente.id,
            tipoEventoId: tipoEvento.id,
            inicio,
            fin,
            lugar,
            asistentes,
            venceAt,
            nombreTipoEvento: tipoEvento.nombre,
            precioBaseTipoEvento: tipoEvento.precioBase,
            subtotal: dinero(subtotal),
            recargoCliente: dinero(recargoCliente),
            total: dinero(total),
            porcentajeAnticipo: dinero(porcentajeAnticipo),
            montoAnticipo: dinero(montoAnticipo),
            estado,
            ...(createdAt && { createdAt }),
            recursos: {
                create: recursosSnapshot
            }
        }
    });
};

const crearPagos = async (presupuesto, pagos) => {
    const total = Number(presupuesto.total);
    const anticipo = Number(presupuesto.montoAnticipo);
    const saldo = total - anticipo;

    for (const pago of pagos) {
        const monto = pago.tipo === "ANTICIPO" ? anticipo : saldo;

        await prisma.pago.create({
            data: {
                presupuestoId: presupuesto.id,
                tipo: pago.tipo,
                monto: dinero(pago.monto ?? monto),
                estado: pago.estado,
                fechaPago: pago.fechaPago ?? null,
                referencia: pago.referencia ?? null,
                ...(pago.createdAt && { createdAt: pago.createdAt })
            }
        });
    }
};

const crearEvento = ({
    presupuesto,
    productor,
    tipoEvento,
    cliente,
    inicio,
    fin,
    lugar,
    asistentes,
    estado,
    observaciones,
    recursos,
    createdAt
}) =>
    prisma.evento.create({
        data: {
            clienteId: cliente.id,
            productorId: productor.id,
            tipoEventoId: tipoEvento.id,
            presupuestoId: presupuesto.id,
            inicio,
            fin,
            lugar,
            asistentes,
            estado,
            observaciones: observaciones ?? null,
            ...(createdAt && { createdAt }),
            recursos: {
                create: recursos.map(({ recurso, cantidad }) => ({
                    recursoId: recurso.id,
                    cantidad
                }))
            }
        }
    });

const main = async () => {
    await wipeDatabase();

    const passwordHash = await bcrypt.hash(PASSWORD_PRUEBA, 12);

    console.log("Creando usuarios de prueba...");

    const admin = await prisma.usuario.create({
        data: {
            email: "admin.prueba@nes.cl",
            passwordHash,
            rol: "ADMIN",
            activo: true
        }
    });

    const cliente1 = await crearClientePersona(passwordHash, 1, {
        rut: "12.345.678-5",
        nombres: "María José",
        apellidos: "Pérez Rojas",
        telefono: "+56961234567"
    });

    const cliente2 = await crearClientePersona(passwordHash, 2, {
        rut: "17.456.789-1",
        nombres: "Diego Andrés",
        apellidos: "Muñoz Silva",
        telefono: "+56962345678"
    });

    const cliente3 = await crearClientePersona(passwordHash, 3, {
        rut: "19.876.543-0",
        nombres: "Camila Fernanda",
        apellidos: "Soto Reyes",
        telefono: "+56963456789"
    });

    const cliente4 = await crearClientePersona(passwordHash, 4, {
        rut: "15.432.109-8",
        nombres: "Sebastián Ignacio",
        apellidos: "Contreras Peña",
        telefono: "+56964567890"
    });

    const cliente5 = await crearClienteEmpresa(passwordHash, 5, {
        rutEmpresa: "76.123.456-0",
        razonSocial: "Constructora Andes Sur SpA",
        casaMatriz: "Av. Paicaví 1450, Concepción",
        telefono: "+56412234567"
    });

    const cliente6 = await crearClienteEmpresa(passwordHash, 6, {
        rutEmpresa: "76.543.210-3",
        razonSocial: "Clínica BioBío Ltda.",
        casaMatriz: "Av. Pedro de Valdivia 801, Concepción",
        telefono: "+56412345678"
    });

    const productor1 = await crearProductor(passwordHash, 1, {
        nombres: "Valentina",
        apellidos: "Rojas Mella",
        telefono: "+56971112222"
    });

    const productor2 = await crearProductor(passwordHash, 2, {
        nombres: "Nicolás",
        apellidos: "Sepúlveda Araya",
        telefono: "+56972223333"
    });

    const productor3 = await crearProductor(passwordHash, 3, {
        nombres: "Fernanda",
        apellidos: "Carrasco Vidal",
        telefono: "+56973334444"
    });

    const productor4 = await crearProductor(passwordHash, 4, {
        nombres: "Tomás",
        apellidos: "Fuentes Lagos",
        telefono: "+56974445555"
    });

    console.log("Creando catálogo de tipos de evento...");

    const matrimonio = await prisma.tipoEvento.create({
        data: {
            nombre: "Matrimonio",
            descripcion: "Celebración de matrimonio con coordinación integral, montaje y producción del evento.",
            precioBase: "1200000.00",
            activo: true
        }
    });

    const cumpleanos = await prisma.tipoEvento.create({
        data: {
            nombre: "Cumpleaños",
            descripcion: "Celebración de cumpleaños adaptable a distintos tamaños, edades y formatos.",
            precioBase: "450000.00",
            activo: true
        }
    });

    const corporativo = await prisma.tipoEvento.create({
        data: {
            nombre: "Evento corporativo",
            descripcion: "Producción de aniversarios, lanzamientos, jornadas internas y celebraciones de empresa.",
            precioBase: "850000.00",
            activo: true
        }
    });

    const graduacion = await prisma.tipoEvento.create({
        data: {
            nombre: "Graduación",
            descripcion: "Ceremonias y celebraciones de licenciatura o graduación para instituciones educacionales.",
            precioBase: "700000.00",
            activo: true
        }
    });

    const seminario = await prisma.tipoEvento.create({
        data: {
            nombre: "Seminario y conferencia",
            descripcion: "Producción técnica y logística para seminarios, charlas, congresos y conferencias.",
            precioBase: "650000.00",
            activo: true
        }
    });

    const gala = await prisma.tipoEvento.create({
        data: {
            nombre: "Gala institucional",
            descripcion: "Formato formal de gran escala para cenas, premiaciones y ceremonias institucionales.",
            precioBase: "1500000.00",
            activo: false
        }
    });

    console.log("Creando recursos...");

    const silla = await crearRecursoMaterial({
        nombre: "Silla Tiffany",
        descripcion: "Silla para ceremonias, cenas y montajes formales.",
        precioUnitario: "4500.00",
        stockTotal: 300,
        activo: true,
        unidad: "unidad"
    });

    const mesa = await crearRecursoMaterial({
        nombre: "Mesa redonda 10 personas",
        descripcion: "Mesa redonda para montaje de banquetería.",
        precioUnitario: "18000.00",
        stockTotal: 40,
        activo: true,
        unidad: "unidad"
    });

    const amplificacion = await crearRecursoMaterial({
        nombre: "Sistema de amplificación",
        descripcion: "Sistema de sonido para eventos medianos y grandes.",
        precioUnitario: "180000.00",
        stockTotal: 6,
        activo: true,
        unidad: "equipo"
    });

    const iluminacion = await crearRecursoMaterial({
        nombre: "Iluminación ambiental LED",
        descripcion: "Kit de iluminación ambiental y decorativa regulable.",
        precioUnitario: "120000.00",
        stockTotal: 8,
        activo: true,
        unidad: "kit"
    });

    const proyector = await crearRecursoMaterial({
        nombre: "Proyector y telón",
        descripcion: "Proyector Full HD con telón para presentaciones.",
        precioUnitario: "90000.00",
        stockTotal: 5,
        activo: true,
        unidad: "equipo"
    });

    const decoracionFloral = await crearRecursoMaterial({
        nombre: "Decoración floral base",
        descripcion: "Set floral para mesas principales y puntos destacados.",
        precioUnitario: "160000.00",
        stockTotal: 12,
        activo: true,
        unidad: "set"
    });

    const vajilla = await crearRecursoMaterial({
        nombre: "Vajilla completa",
        descripcion: "Plato, cubiertos, copa y vaso por asistente.",
        precioUnitario: "3500.00",
        stockTotal: 500,
        activo: true,
        unidad: "persona"
    });

    const cabinaFotos = await crearRecursoMaterial({
        nombre: "Cabina fotográfica",
        descripcion: "Cabina de fotografías con impresión instantánea.",
        precioUnitario: "220000.00",
        stockTotal: 2,
        activo: false,
        unidad: "equipo"
    });

    const garzon = await crearRecursoHumano({
        nombre: "Garzón",
        descripcion: "Personal de atención de mesas durante el evento.",
        precioUnitario: "45000.00",
        stockTotal: 30,
        origen: "EXTERNO"
    });

    const coordinador = await crearRecursoHumano({
        nombre: "Coordinador de evento",
        descripcion: "Responsable operativo y punto de coordinación durante el evento.",
        precioUnitario: "120000.00",
        stockTotal: 6,
        origen: "INTERNO"
    });

    const tecnico = await crearRecursoHumano({
        nombre: "Técnico audiovisual",
        descripcion: "Operación de amplificación, proyección e iluminación.",
        precioUnitario: "95000.00",
        stockTotal: 5,
        origen: "INTERNO"
    });

    const guardia = await crearRecursoHumano({
        nombre: "Guardia de seguridad",
        descripcion: "Apoyo de control de acceso y seguridad del recinto.",
        precioUnitario: "60000.00",
        stockTotal: 12,
        origen: "EXTERNO"
    });

    const maestroCeremonia = await crearRecursoHumano({
        nombre: "Maestro de ceremonia",
        descripcion: "Conducción protocolar y coordinación del programa del evento.",
        precioUnitario: "150000.00",
        stockTotal: 6,
        origen: "EXTERNO"
    });

    const recursosMatrimonio = [
        { recurso: silla, cantidad: 120 },
        { recurso: mesa, cantidad: 12 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: iluminacion, cantidad: 1 },
        { recurso: decoracionFloral, cantidad: 2 },
        { recurso: vajilla, cantidad: 120 },
        { recurso: garzon, cantidad: 8 },
        { recurso: coordinador, cantidad: 1 }
    ];

    const recursosCorporativo = [
        { recurso: silla, cantidad: 180 },
        { recurso: mesa, cantidad: 18 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: iluminacion, cantidad: 2 },
        { recurso: proyector, cantidad: 1 },
        { recurso: vajilla, cantidad: 180 },
        { recurso: garzon, cantidad: 10 },
        { recurso: coordinador, cantidad: 1 },
        { recurso: tecnico, cantidad: 1 },
        { recurso: guardia, cantidad: 2 }
    ];

    const recursosCumpleanos = [
        { recurso: silla, cantidad: 50 },
        { recurso: mesa, cantidad: 5 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: iluminacion, cantidad: 1 },
        { recurso: vajilla, cantidad: 50 },
        { recurso: garzon, cantidad: 3 },
        { recurso: coordinador, cantidad: 1 }
    ];

    const recursosGraduacion = [
        { recurso: silla, cantidad: 150 },
        { recurso: mesa, cantidad: 15 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: iluminacion, cantidad: 1 },
        { recurso: proyector, cantidad: 1 },
        { recurso: garzon, cantidad: 6 },
        { recurso: coordinador, cantidad: 1 },
        { recurso: tecnico, cantidad: 1 }
    ];

    const recursosSeminario = [
        { recurso: silla, cantidad: 80 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: proyector, cantidad: 1 },
        { recurso: tecnico, cantidad: 1 },
        { recurso: coordinador, cantidad: 1 }
    ];

    const recursosGala = [
        { recurso: silla, cantidad: 100 },
        { recurso: mesa, cantidad: 10 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: iluminacion, cantidad: 2 },
        { recurso: decoracionFloral, cantidad: 3 },
        { recurso: vajilla, cantidad: 100 },
        { recurso: garzon, cantidad: 8 },
        { recurso: coordinador, cantidad: 1 },
        { recurso: maestroCeremonia, cantidad: 1 }
    ];

    const recursosCorporativoMediano = [
        { recurso: silla, cantidad: 90 },
        { recurso: mesa, cantidad: 9 },
        { recurso: amplificacion, cantidad: 1 },
        { recurso: proyector, cantidad: 1 },
        { recurso: vajilla, cantidad: 90 },
        { recurso: garzon, cantidad: 5 },
        { recurso: coordinador, cantidad: 1 },
        { recurso: tecnico, cantidad: 1 }
    ];

    console.log("Creando presupuestos...");

    const presupuesto1 = await crearPresupuesto({
        cliente: cliente1.cliente,
        tipoEvento: matrimonio,
        inicio: fecha("2026-11-07T18:00:00-03:00"),
        fin: fecha("2026-11-08T02:00:00-03:00"),
        lugar: "Centro de Eventos SurActivo, Concepción",
        asistentes: 120,
        venceAt: fecha("2026-10-25T23:59:59-03:00"),
        estado: "ACEPTADO",
        recursos: recursosMatrimonio,
        createdAt: fecha("2026-09-28T11:20:00-03:00")
    });

    const presupuesto2 = await crearPresupuesto({
        cliente: cliente5.cliente,
        tipoEvento: corporativo,
        inicio: fecha("2026-12-11T09:00:00-03:00"),
        fin: fecha("2026-12-11T18:00:00-03:00"),
        lugar: "Hotel MDS, Talcahuano",
        asistentes: 180,
        venceAt: fecha("2026-11-10T23:59:59-03:00"),
        estado: "ACEPTADO",
        recursos: recursosCorporativo,
        createdAt: fecha("2026-09-30T09:05:00-03:00")
    });

    const presupuesto3 = await crearPresupuesto({
        cliente: cliente2.cliente,
        tipoEvento: cumpleanos,
        inicio: fecha("2026-11-21T20:00:00-03:00"),
        fin: fecha("2026-11-22T02:00:00-03:00"),
        lugar: "Club de Campo Bellavista, Concepción",
        asistentes: 50,
        venceAt: fecha("2026-10-31T23:59:59-03:00"),
        estado: "ACEPTADO",
        recursos: recursosCumpleanos,
        createdAt: fecha("2026-10-02T16:45:00-03:00")
    });

    const presupuesto4 = await crearPresupuesto({
        cliente: cliente3.cliente,
        tipoEvento: graduacion,
        inicio: fecha("2026-09-26T19:00:00-03:00"),
        fin: fecha("2026-09-27T01:00:00-03:00"),
        lugar: "Centro Español, Concepción",
        asistentes: 150,
        venceAt: fecha("2026-09-05T23:59:59-03:00"),
        estado: "ACEPTADO",
        recursos: recursosGraduacion,
        createdAt: fecha("2026-08-18T10:10:00-04:00")
    });

    const presupuesto5 = await crearPresupuesto({
        cliente: cliente6.cliente,
        tipoEvento: seminario,
        inicio: fecha("2026-11-12T08:30:00-03:00"),
        fin: fecha("2026-11-12T17:30:00-03:00"),
        lugar: "Auditorio Universidad del Bío-Bío, Concepción",
        asistentes: 80,
        venceAt: fecha("2026-10-20T23:59:59-03:00"),
        estado: "PENDIENTE_PAGO",
        recursos: recursosSeminario,
        createdAt: fecha("2026-10-09T14:30:00-03:00")
    });

    const presupuesto6 = await crearPresupuesto({
        cliente: cliente4.cliente,
        tipoEvento: gala,
        inicio: fecha("2026-12-19T20:00:00-03:00"),
        fin: fecha("2026-12-20T02:00:00-03:00"),
        lugar: "Club Concepción",
        asistentes: 100,
        venceAt: fecha("2026-10-08T23:59:59-03:00"),
        estado: "VENCIDO",
        recursos: recursosGala,
        createdAt: fecha("2026-09-20T18:10:00-03:00")
    });

    const presupuesto7 = await crearPresupuesto({
        cliente: cliente6.cliente,
        tipoEvento: corporativo,
        inicio: fecha("2026-10-04T12:00:00-03:00"),
        fin: fecha("2026-10-04T17:00:00-03:00"),
        lugar: "Centro de Convenciones Marina del Sol, Talcahuano",
        asistentes: 90,
        venceAt: fecha("2026-09-25T23:59:59-03:00"),
        estado: "CANCELADO",
        recursos: recursosCorporativoMediano,
        createdAt: fecha("2026-09-10T12:00:00-03:00")
    });

    const presupuesto8 = await crearPresupuesto({
        cliente: cliente4.cliente,
        tipoEvento: seminario,
        inicio: fecha("2027-01-16T10:00:00-03:00"),
        fin: fecha("2027-01-16T16:00:00-03:00"),
        lugar: "Por definir",
        asistentes: 60,
        venceAt: null,
        estado: "BORRADOR",
        recursos: [
            { recurso: silla, cantidad: 60 },
            { recurso: proyector, cantidad: 1 },
            { recurso: tecnico, cantidad: 1 }
        ],
        createdAt: fecha("2026-10-13T21:15:00-03:00")
    });

    const presupuesto9 = await crearPresupuesto({
        cliente: cliente5.cliente,
        tipoEvento: corporativo,
        inicio: fecha("2026-10-14T09:00:00-03:00"),
        fin: fecha("2026-10-14T18:00:00-03:00"),
        lugar: "Centro de Eventos Mitrinco, Chiguayante",
        asistentes: 90,
        venceAt: fecha("2026-10-01T23:59:59-03:00"),
        estado: "ACEPTADO",
        recursos: recursosCorporativoMediano,
        createdAt: fecha("2026-09-15T09:30:00-03:00")
    });

    console.log("Creando pagos...");

    await crearPagos(presupuesto1, [
        {
            tipo: "ANTICIPO",
            estado: "PAGADO",
            fechaPago: fecha("2026-10-01T12:14:00-03:00"),
            referencia: "WEBPAY-100001"
        },
        {
            tipo: "SALDO",
            estado: "PENDIENTE"
        }
    ]);

    await crearPagos(presupuesto2, [
        {
            tipo: "ANTICIPO",
            estado: "PAGADO",
            fechaPago: fecha("2026-10-03T10:42:00-03:00"),
            referencia: "TRANSFER-200001"
        },
        {
            tipo: "SALDO",
            estado: "PENDIENTE"
        }
    ]);

    await crearPagos(presupuesto3, [
        {
            tipo: "ANTICIPO",
            estado: "PAGADO",
            fechaPago: fecha("2026-10-05T18:30:00-03:00"),
            referencia: "WEBPAY-300001"
        },
        {
            tipo: "SALDO",
            estado: "PENDIENTE"
        }
    ]);

    await crearPagos(presupuesto4, [
        {
            tipo: "ANTICIPO",
            estado: "PAGADO",
            fechaPago: fecha("2026-08-22T12:00:00-04:00"),
            referencia: "WEBPAY-400001"
        },
        {
            tipo: "SALDO",
            estado: "PAGADO",
            fechaPago: fecha("2026-09-20T16:25:00-03:00"),
            referencia: "WEBPAY-400002"
        }
    ]);

    await crearPagos(presupuesto5, [
        {
            tipo: "ANTICIPO",
            estado: "FALLIDO",
            referencia: "WEBPAY-500001-FAIL",
            createdAt: fecha("2026-10-10T10:05:00-03:00")
        },
        {
            tipo: "ANTICIPO",
            estado: "PENDIENTE",
            createdAt: fecha("2026-10-11T09:30:00-03:00")
        }
    ]);

    await crearPagos(presupuesto7, [
        {
            tipo: "ANTICIPO",
            estado: "REEMBOLSADO",
            fechaPago: fecha("2026-09-18T11:45:00-03:00"),
            referencia: "WEBPAY-700001-REFUND"
        }
    ]);

    await crearPagos(presupuesto9, [
        {
            tipo: "ANTICIPO",
            estado: "PAGADO",
            fechaPago: fecha("2026-09-20T13:15:00-03:00"),
            referencia: "TRANSFER-900001"
        },
        {
            tipo: "SALDO",
            estado: "PAGADO",
            fechaPago: fecha("2026-10-10T10:20:00-03:00"),
            referencia: "TRANSFER-900002"
        }
    ]);

    console.log("Creando eventos...");

    const evento1 = await crearEvento({
        presupuesto: presupuesto1,
        productor: productor1.productor,
        tipoEvento: matrimonio,
        cliente: cliente1.cliente,
        inicio: fecha("2026-11-07T18:00:00-03:00"),
        fin: fecha("2026-11-08T02:00:00-03:00"),
        lugar: "Centro de Eventos SurActivo, Concepción",
        asistentes: 120,
        estado: "CONFIRMADO",
        observaciones: "Ceremonia civil en el mismo recinto. Montaje disponible desde las 11:00.",
        recursos: recursosMatrimonio,
        createdAt: fecha("2026-10-02T09:00:00-03:00")
    });

    const evento2 = await crearEvento({
        presupuesto: presupuesto2,
        productor: productor2.productor,
        tipoEvento: corporativo,
        cliente: cliente5.cliente,
        inicio: fecha("2026-12-11T09:00:00-03:00"),
        fin: fecha("2026-12-11T18:00:00-03:00"),
        lugar: "Hotel MDS, Talcahuano",
        asistentes: 180,
        estado: "POSPUESTO",
        observaciones: "Fecha reprogramada a solicitud del cliente. Mantener montaje corporativo y escenario principal.",
        recursos: recursosCorporativo,
        createdAt: fecha("2026-10-04T10:15:00-03:00")
    });

    const evento3 = await crearEvento({
        presupuesto: presupuesto3,
        productor: productor3.productor,
        tipoEvento: cumpleanos,
        cliente: cliente2.cliente,
        inicio: fecha("2026-11-21T20:00:00-03:00"),
        fin: fecha("2026-11-22T02:00:00-03:00"),
        lugar: "Club de Campo Bellavista, Concepción",
        asistentes: 50,
        estado: "CONFIRMADO",
        observaciones: "Celebración de 30 años. Cliente solicita música bailable y espacio para fotografías.",
        recursos: recursosCumpleanos,
        createdAt: fecha("2026-10-06T11:10:00-03:00")
    });

    const evento4 = await crearEvento({
        presupuesto: presupuesto4,
        productor: productor4.productor,
        tipoEvento: graduacion,
        cliente: cliente3.cliente,
        inicio: fecha("2026-09-26T19:00:00-03:00"),
        fin: fecha("2026-09-27T01:00:00-03:00"),
        lugar: "Centro Español, Concepción",
        asistentes: 150,
        estado: "COMPLETADO",
        observaciones: "Evento realizado sin incidentes. Ceremonia y cena ejecutadas según programa.",
        recursos: recursosGraduacion,
        createdAt: fecha("2026-08-24T15:40:00-04:00")
    });

    const evento5 = await crearEvento({
        presupuesto: presupuesto7,
        productor: productor1.productor,
        tipoEvento: corporativo,
        cliente: cliente6.cliente,
        inicio: fecha("2026-10-04T12:00:00-03:00"),
        fin: fecha("2026-10-04T17:00:00-03:00"),
        lugar: "Centro de Convenciones Marina del Sol, Talcahuano",
        asistentes: 90,
        estado: "CANCELADO",
        observaciones: "Cancelado por el cliente con anticipación. Anticipo reembolsado.",
        recursos: recursosCorporativoMediano,
        createdAt: fecha("2026-09-19T09:10:00-03:00")
    });

    const evento6 = await crearEvento({
        presupuesto: presupuesto9,
        productor: productor2.productor,
        tipoEvento: corporativo,
        cliente: cliente5.cliente,
        inicio: fecha("2026-10-14T09:00:00-03:00"),
        fin: fecha("2026-10-14T18:00:00-03:00"),
        lugar: "Centro de Eventos Mitrinco, Chiguayante",
        asistentes: 90,
        estado: "EN_CURSO",
        observaciones: "Jornada anual de seguridad y cierre de proyectos. Producción en ejecución.",
        recursos: recursosCorporativoMediano,
        createdAt: fecha("2026-09-22T10:00:00-03:00")
    });

    console.log("Creando calificaciones e historial...");

    await prisma.calificacion.create({
        data: {
            eventoId: evento4.id,
            puntuacion: 5,
            comentario: "Muy buena coordinación y cumplimiento de los horarios."
        }
    });

    await prisma.eventoCambio.createMany({
        data: [
            {
                eventoId: evento2.id,
                usuarioId: admin.id,
                campo: "inicio",
                valorAnterior: "2026-12-05T09:00:00-03:00",
                valorNuevo: "2026-12-11T09:00:00-03:00",
                createdAt: fecha("2026-10-09T11:20:00-03:00")
            },
            {
                eventoId: evento2.id,
                usuarioId: admin.id,
                campo: "fin",
                valorAnterior: "2026-12-05T18:00:00-03:00",
                valorNuevo: "2026-12-11T18:00:00-03:00",
                createdAt: fecha("2026-10-09T11:20:00-03:00")
            },
            {
                eventoId: evento2.id,
                usuarioId: admin.id,
                campo: "estado",
                valorAnterior: "CONFIRMADO",
                valorNuevo: "POSPUESTO",
                createdAt: fecha("2026-10-09T11:21:00-03:00")
            },
            {
                eventoId: evento1.id,
                usuarioId: cliente1.usuario.id,
                campo: "observaciones",
                valorAnterior: null,
                valorNuevo: "Ceremonia civil en el mismo recinto.",
                createdAt: fecha("2026-10-07T18:05:00-03:00")
            }
        ]
    });

    const resumen = {
        usuarios: await prisma.usuario.count(),
        clientes: await prisma.cliente.count(),
        productores: await prisma.productor.count(),
        tiposEvento: await prisma.tipoEvento.count(),
        recursos: await prisma.recurso.count(),
        presupuestos: await prisma.presupuesto.count(),
        pagos: await prisma.pago.count(),
        eventos: await prisma.evento.count(),
        calificaciones: await prisma.calificacion.count(),
        cambiosEvento: await prisma.eventoCambio.count()
    };

    console.log("\nSeed V2 completado.");
    console.table(resumen);

    console.log("\nCredenciales de prueba");
    console.log(`Contraseña común: ${PASSWORD_PRUEBA}`);
    console.log("Admin:       admin.prueba@nes.cl");
    console.log("Clientes:    cliente1.prueba@nes.cl ... cliente6.prueba@nes.cl");
    console.log("Productores: productor1.prueba@nes.cl ... productor4.prueba@nes.cl");

    // Evita warnings por variables creadas solo para poblar relaciones y estados distintos.
    void presupuesto6;
    void presupuesto8;
    void cabinaFotos;
    void evento3;
    void evento5;
    void evento6;
};

main()
    .catch((error) => {
        console.error("Error al ejecutar el seed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
