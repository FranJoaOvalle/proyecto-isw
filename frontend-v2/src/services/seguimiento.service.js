import api from "./_api";

export const getEventosSeguimiento = async (params) => (await api.get("/eventos", { params })).data;
export const getEventoSeguimiento = async (id) => (await api.get(`/eventos/${id}`)).data;
export const getSeguimientos = async (id, params) => (await api.get(`/eventos/${id}/seguimiento`, { params })).data;
export const getAutoresSeguimiento = async (id) => (await api.get(`/eventos/${id}/seguimiento/autores`)).data;
export const crearSeguimiento = async (id, data) => (await api.post(`/eventos/${id}/seguimiento`, data)).data;
export const getComentariosSeguimiento = async (id, registroId) => (await api.get(`/eventos/${id}/seguimiento/${registroId}/comentarios`)).data;
export const comentarSeguimiento = async (id, registroId, comentario) => (await api.post(`/eventos/${id}/seguimiento/${registroId}/comentarios`, { comentario })).data;
