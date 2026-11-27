const BadRequestException =
    require("../exceptions/BadRequestException");

function validarRespuestasEncuesta(preguntas, respuestas) {
    const idsValidos = new Set(
        preguntas.map(p => String(p.id))
    );

    const respuestasValidadas = {};

    for (const id of Object.keys(respuestas)) {
        if (!idsValidos.has(id)) {
            throw new BadRequestException(
                "La encuesta contiene respuestas desconocidas."
            );
        }
    }

    for (const pregunta of preguntas) {
        const valor = respuestas[pregunta.id];

        const vacio =
            valor === undefined ||
            valor === null ||
            (typeof valor === "string" && !valor.trim()) ||
            (Array.isArray(valor) && valor.length === 0);

        if (vacio) {
            if (pregunta.obligatoria) {
                throw new BadRequestException(
                    `Debes responder: ${pregunta.enunciado}`
                );
            }

            continue;
        }

        let valido = false;

        switch (pregunta.tipo) {
            case "ESCALA":
                valido =
                    Number.isInteger(valor) &&
                    valor >= 1 &&
                    valor <= 5;
                break;

            case "TEXTO":
                valido =
                    typeof valor === "string" &&
                    valor.trim().length <= 2000;
                break;

            case "SI_NO":
                valido = typeof valor === "boolean";
                break;

            case "SELECCION_UNICA":
                valido =
                    typeof valor === "string" &&
                    pregunta.opciones.includes(valor);
                break;

            case "SELECCION_MULTIPLE":
                valido =
                    Array.isArray(valor) &&
                    new Set(valor).size === valor.length &&
                    valor.every(opcion =>
                        pregunta.opciones.includes(opcion)
                    );
                break;
        }

        if (!valido) {
            throw new BadRequestException(`Respuesta inválida: ${pregunta.enunciado}`
            );
        }

        respuestasValidadas[pregunta.id] = typeof valor === "string" ? valor.trim() : valor;
    }

    return respuestasValidadas;
}

module.exports = validarRespuestasEncuesta;