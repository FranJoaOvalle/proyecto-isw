export const nombresEstadoPresupuesto = {
    BORRADOR: "Borrador",
    ENVIADO: "Enviada",
    PENDIENTE_PAGO: "Pendiente de pago",
    ACEPTADO: "Aceptada",
    CANCELADO: "Cancelada",
    VENCIDO: "Vencida"
};

export const propuestaVigente = (presupuesto) => presupuesto.estado === "ENVIADO" &&
    Boolean(presupuesto.venceAt) && new Date(presupuesto.venceAt) > new Date();

export const estadoPropuestaCliente = (presupuesto) => presupuesto.estado === "ENVIADO"
    ? propuestaVigente(presupuesto) ? "Recibida · pendiente de tu aceptación" : "Vencida"
    : nombresEstadoPresupuesto[presupuesto.estado] ?? presupuesto.estado;

export const monedaPresupuesto = (valor) => Number(valor ?? 0).toLocaleString("es-CL", {
    style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 2
});
