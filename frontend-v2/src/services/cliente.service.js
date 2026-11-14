import api from "./_api";

export const getClientes = async () => {
    const response = await api.get("/clientes");
    return response.data.clientes;
};

export const cambiarEstadoCliente = async (id, activo) => {
    const response = await api.patch(`/clientes/${id}/estado`, {
        activo
    });

    return response.data.cliente;
};

export const getCliente = async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data.cliente;
};