import api from "./api";

export const getClientes = async (incluirInactivos = false) => {
    const response = await api.get("/clientes", {
        params: { incluirInactivos }
    });

    return response.data;
};

export const getCliente = async id => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
};

export const createCliente = async data => {
    const response = await api.post("/clientes", data);
    return response.data;
};

export const updateCliente = async (id, data) => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
};

export const deactivateCliente = async id => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
};

export const reactivateCliente = async id => {
    const response = await api.patch(`/clientes/${id}/reactivar`);
    return response.data;
};

export const createClienteUsuario = async (id, data) => {
    const response = await api.post(`/clientes/${id}/usuario`, data);
    return response.data;
};

export const getAutorizacionesCliente = async clienteId => {
    const response = await api.get(
        `/clientes/${clienteId}/autorizaciones`
    );

    return response.data;
};

export const asignarAutorizacionCliente = async (clienteId, usuarioId) => {
    const response = await api.post(
        `/clientes/${clienteId}/autorizaciones/${usuarioId}`
    );

    return response.data;
};

export const quitarAutorizacionCliente = async (clienteId, usuarioId) => {
    const response = await api.delete(
        `/clientes/${clienteId}/autorizaciones/${usuarioId}`
    );

    return response.data;
};