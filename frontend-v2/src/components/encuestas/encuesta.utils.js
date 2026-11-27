export const TIPOS_ENCUESTA = {
    CLIENTE_EVENTO: "Satisfacción del cliente",
    ADMIN_PRODUCTOR: "Desempeño del productor"
};

export const TIPOS_PREGUNTA = {
    ESCALA: "Escala del 1 al 5",
    TEXTO: "Texto libre",
    SI_NO: "Sí / No",
    SELECCION_UNICA: "Selección única",
    SELECCION_MULTIPLE: "Selección múltiple"
};

export const requiereOpciones = (tipo) =>
    tipo === "SELECCION_UNICA" ||
    tipo === "SELECCION_MULTIPLE";

export const nuevaPregunta = () => ({
    enunciado: "",
    tipo: "ESCALA",
    obligatoria: true,
    opciones: []
});

export const nuevaEncuesta = () => ({
    nombre: "",
    descripcion: "",
    tipo: "CLIENTE_EVENTO",
    preguntas: [nuevaPregunta()]
});

export const respuestaVacia = (valor) =>
    valor === undefined ||
    valor === null ||
    (typeof valor === "string" && !valor.trim()) ||
    (Array.isArray(valor) && valor.length === 0);

export const validarRespuestasObligatorias = (preguntas, respuestas) => {
    return preguntas.filter(
        pregunta =>
            pregunta.obligatoria &&
            respuestaVacia(respuestas[pregunta.id])
    );
};