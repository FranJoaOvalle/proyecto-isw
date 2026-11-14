import api from "./_api";

export const listarEventosCliente = async () => {
    const response = await api.get("/eventos/cliente");
    const eventos = response.data?.eventos ?? response.data?.items ?? response.data;
    if (!Array.isArray(eventos)) {
        throw new Error("El servidor no devolvió una lista de eventos válida.");
    }
    return eventos;
};

export const obtenerEventoCliente = async (id) => {
    const response = await api.get(`/eventos/cliente/${id}`);
    return response.data?.evento ?? response.data;
};
