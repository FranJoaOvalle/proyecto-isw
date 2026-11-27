import api from "./_api";

export const getEncuestas = async (tipo) => {
    const response = await api.get("/encuestas", {
        params: tipo ? { tipo } : {}
    });

    return response.data;
};

export const getEncuesta = async (id) => {
    const response = await api.get(`/encuestas/${id}`);
    return response.data;
};

export const createEncuesta = async (data) => {
    const response = await api.post("/encuestas", data);
    return response.data;
};

export const updateEncuesta = async (id, data) => {
    const response = await api.put(`/encuestas/${id}`, data);
    return response.data;
};

export const cambiarEstadoEncuesta = async (id, activo) => {
    const response = await api.patch(`/encuestas/${id}/estado`, {
        activo
    });

    return response.data;
};

export const establecerEncuestaPredeterminada = async (id) => {
    const response = await api.put(
        `/encuestas/${id}/predeterminada`
    );

    return response.data;
};