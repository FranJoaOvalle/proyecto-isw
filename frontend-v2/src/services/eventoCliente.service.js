import api from "./_api";

export const listarEventosCliente = async () => {
    const response = await api.get("/eventos/cliente");
    const eventos = response.data?.eventos ?? response.data?.items ?? response.data;
    if (!Array.isArray(eventos)) {
        throw new Error("No se pudo leer la lista de tus eventos. Vuelve a intentarlo.");
    }
    return eventos;
};

export const obtenerEventoCliente = async (id) => {
    const response = await api.get(`/eventos/cliente/${id}`);
    return response.data?.evento ?? response.data;
};
