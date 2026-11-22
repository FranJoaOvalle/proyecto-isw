import api from "./_api";

export const listarPagos = async (filtros = {}) => {
    const params = Object.fromEntries(
        Object.entries(filtros).flatMap(([clave, valor]) => {
            const normalizado = typeof valor === "string" ? valor.trim() : valor;
            return normalizado === "" || normalizado === null || normalizado === undefined || normalizado === "TODOS"
                ? []
                : [[clave, normalizado]];
        })
    );
    const response = await api.get("/pagos", { params });
    return response.data;
};

export const registrarPago = async (presupuestoId, tipo) => {
    const response = await api.post("/pagos", { presupuestoId: Number(presupuestoId), tipo });
    return response.data;
};

export const confirmarPago = async (id, referencia) => {
    const response = await api.post(`/pagos/${id}/confirmar`, referencia ? { referencia } : {});
    return response.data;
};

export const enviarEncuestaPago = async (id) => {
    const response = await api.post(`/pagos/${id}/encuesta`, {});
    return response.data;
};
