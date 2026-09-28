import api from './api';

export const getEventos = async () => {
    const response = await api.get('/eventos');
    return response.data; 
};

export const getEventoById = async (id) => {
    const response = await api.get(`/eventos/${id}`);
    return response.data;
};

export const createEvento = async (data) => {
    const response = await api.post('/eventos', data);
    return response.data;
};

export const updateEvento = async (id, data) => {
    const response = await api.put(`/eventos/${id}`, data);
    return response.data;
};

export const cancelarEvento = async (id) => {
    const response = await api.patch(`/eventos/${id}/cancelar`);
    return response.data;
};