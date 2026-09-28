const ValidationException = require("../exceptions/ValidationException");
module.exports = data => {
    const costo = data.costoArriendo != null;
    const unidad = data.unidadArriendo != null;
    if (costo !== unidad) throw new ValidationException("Indique costo y unidad de arriendo juntos, o deje ambos sin informar.");
    if (data.origen && data.origen !== "ARRENDADO" && (costo || unidad)) {
        throw new ValidationException("Solo los equipos arrendados pueden tener costo de arriendo.");
    }
};
