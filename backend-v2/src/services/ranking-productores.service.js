const prisma = require("../config/prisma");

const PESO_GERENCIA = 0.7;
const PESO_CLIENTES = 0.3;
const MIN_EVALUACIONES = 3;

function promedio(valores) {
    if (!valores.length) return null;
    return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

function redondear(valor) {
    return valor === null
        ? null
        : Number(valor.toFixed(2));
}

function puntuacionValida(valor) {
    return Number.isInteger(valor) && valor >= 1 && valor <= 5;
}

class RankingProductoresService {

    async obtener({ desde, hasta } = {}) {
        const whereEventos = {
            estado: "COMPLETADO"
        };

        if (desde || hasta) {
            whereEventos.fin = {
                ...(desde && { gte: new Date(desde) }),
                ...(hasta && { lt: new Date(hasta) })
            };
        }

        const productores = await prisma.productor.findMany({
            where: {
                usuario: {
                    activo: true
                }
            },

            select: {
                id: true,
                nombres: true,
                apellidos: true,

                eventos: {
                    where: whereEventos,

                    select: {
                        id: true,

                        calificacion: {
                            select: {
                                puntuacion: true
                            }
                        },

                        evaluacionProductor: {
                            select: {
                                productorId: true,
                                puntuacion: true
                            }
                        }
                    }
                }
            }
        });

        const ranking = productores.map(productor => {
            const notasGerencia = productor.eventos
                .filter(evento => evento.evaluacionProductor?.productorId === productor.id)
                .map(evento => evento.evaluacionProductor.puntuacion)
                .filter(puntuacionValida);

            const notasClientes = productor.eventos
                .map(evento => evento.calificacion?.puntuacion)
                .filter(puntuacionValida);

            const promedioGerencia = promedio(notasGerencia);
            const promedioClientes = promedio(notasClientes);

            const puntuacionFinal =
                promedioGerencia !== null &&
                promedioClientes !== null
                    ? promedioGerencia * PESO_GERENCIA +
                    promedioClientes * PESO_CLIENTES
                    : null;

            let estado = "CLASIFICADO";

            if (puntuacionFinal === null) {
                estado = "SIN_DATOS";
            } else if (
                notasGerencia.length < MIN_EVALUACIONES ||
                notasClientes.length < MIN_EVALUACIONES
            ) {
                estado = "PROVISIONAL";
            }

            return {
                productorId: productor.id,
                nombres: productor.nombres,
                apellidos: productor.apellidos,

                eventosCompletados: productor.eventos.length,

                evaluacionesGerencia: notasGerencia.length,
                evaluacionesClientes: notasClientes.length,

                promedioGerencia: redondear(promedioGerencia),
                promedioClientes: redondear(promedioClientes),
                puntuacionFinal: redondear(puntuacionFinal),

                estado,
                posicion: null
            };
        });

        ranking.sort((a, b) => {
            const diferencia = (b.puntuacionFinal ?? -1) - (a.puntuacionFinal ?? -1);
            if (diferencia !== 0) return diferencia;

            return a.productorId - b.productorId;
        });

        ranking.forEach((productor, index) => {
            if (productor.puntuacionFinal === null) return;

            const anterior = ranking[index - 1];

            productor.posicion =
                anterior?.puntuacionFinal === productor.puntuacionFinal
                    ? anterior.posicion
                    : index + 1;
        });

        return {
            configuracion: {
                pesoGerencia: PESO_GERENCIA,
                pesoClientes: PESO_CLIENTES,
                minimoEvaluaciones: MIN_EVALUACIONES
            },
            periodo: {
                desde: desde ?? null,
                hasta: hasta ?? null
            },
            ranking
        };
    }
}

module.exports = new RankingProductoresService();