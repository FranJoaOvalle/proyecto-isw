import api from "./api";

export const getPersonal = async (incluirInactivos = false) => {
    const response = await api.get("/personal", {
        params: { incluirInactivos }
    });

    return response.data;
};

export const createPersonal = async data => {
    const response = await api.post("/personal", data);
    return response.data;
};

export const updatePersonal = async (id, data) => {
    const response = await api.put(`/personal/${id}`, data);
    return response.data;
};

export const deactivatePersonal = async id => {
    const response = await api.delete(`/personal/${id}`);
    return response.data;
};

export const reactivatePersonal = async id => {
    const response = await api.patch(`/personal/${id}/reactivar`);
    return response.data;
};

export const createPersonalUsuario = async (id, data) => {
    const response = await api.post(`/personal/${id}/usuario`, data);
    return response.data;
};

export const getAutorizacionesPersonal = async personalId => {
    const response = await api.get(
        `/personal/${personalId}/autorizaciones`
    );

    return response.data;
};

export const asignarAutorizacionPersonal = async (personalId, usuarioId) => {
    const response = await api.post(
        `/personal/${personalId}/autorizaciones/${usuarioId}`
    );

    return response.data;
};

export const quitarAutorizacionPersonal = async (personalId, usuarioId) => {
    const response = await api.delete(
        `/personal/${personalId}/autorizaciones/${usuarioId}`
    );

    return response.data;
};