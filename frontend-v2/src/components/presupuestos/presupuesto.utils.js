export const nombresEstadoPresupuesto = {
    BORRADOR: "Borrador",
    ENVIADO: "Enviada",
    PENDIENTE_PAGO: "Pendiente de pago",
    ACEPTADO: "Aceptada",
    CANCELADO: "Cancelada",
    VENCIDO: "Vencida"
};

export const monedaPresupuesto = (valor) => Number(valor ?? 0).toLocaleString("es-CL", {
    style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 2
});
