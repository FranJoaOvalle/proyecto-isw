import api from "./_api";

const BASE = "/evaluaciones-productores";

export const getEventosEvaluables = async () => {
    const response = await api.get(`${BASE}/eventos`);
    return response.data;
};

export const reenviarEncuesta = async (id, confirmacion) => {
    // Mantener la confirmación pendiente hasta conocer el resultado SMTP.
    const response = await api.post(`${BASE}/eventos/${id}/reenviar-encuesta`, { confirmacion }, { timeout: 0 });
    return response.data;
};

export const getEvaluacionEvento = async (id) => {
    const response = await api.get(`${BASE}/eventos/${id}`);
    return response.data;
};

export const crearEvaluacionProductor = async (id, data) => {
    const response = await api.post(`${BASE}/eventos/${id}`, data);
    return response.data;
};

export const getHistorialProductor = async (id) => {
    const response = await api.get(`${BASE}/productores/${id}`);
    return response.data;
};

export const getRankingProductores = async (filtros = {}, signal) => {
    const response = await api.get(`${BASE}/ranking`, {
        params: filtros,
        signal
    });
    return response.data;
};
