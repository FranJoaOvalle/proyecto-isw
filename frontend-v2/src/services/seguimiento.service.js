import api from "./_api";
export const editarEvento = async (id, datos) => {
    const response = await api.patch(`/eventos/${id}`, datos);

    return response.data;
};

export const cancelarEvento = async (id) => {
    const response = await api.patch(`/eventos/${id}/cancelar`);

    return response.data;
};

export const eliminarEvento = async (id) => {
    const response = await api.delete(`/eventos/${id}`);

    return response.data;
};

export const getEventosSeguimiento = async (params) => {
    const response = await api.get("/eventos", { params });

    return response.data;
};

export const getEventoSeguimiento = async (id) => {
    const response = await api.get(`/eventos/${id}`);

    return response.data;
};

export const getSeguimientos = async (id, params) => {
    const response = await api.get(`/eventos/${id}/seguimiento`, { params });

    return response.data;
};

export const getAutoresSeguimiento = async (id) => {
    const response = await api.get(`/eventos/${id}/seguimiento/autores`);

    return response.data;
};

export const crearSeguimiento = async (id, data) => {
    const response = await api.post(`/eventos/${id}/seguimiento`, data);

    return response.data;
};

export const getComentariosSeguimiento = async (id, registroId) => {
    const response = await api.get(
        `/eventos/${id}/seguimiento/${registroId}/comentarios`
    );

    return response.data;
};

export const comentarSeguimiento = async (id, registroId, comentario) => {
    const response = await api.post(
        `/eventos/${id}/seguimiento/${registroId}/comentarios`,
        { comentario }
    );

    return response.data;
};
