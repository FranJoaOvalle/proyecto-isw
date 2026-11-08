import api from "./_api";

export const getEspacios = async intervalo => {
    const response = await api.get(
        intervalo ? "/espacios/disponibilidad" : "/espacios",
        { params: intervalo }
    );
    return response.data;
};

export const createEspacio = async data => {
    const response = await api.post("/espacios", data);
    return response.data;
};

export const updateEspacio = async (id, data) => {
    const response = await api.patch(`/espacios/${id}`, data);
    return response.data;
};

export const updateEspacioEstado = async (id, habilitado) => {
    const response = await api.patch(`/espacios/${id}/estado`, { habilitado });
    return response.data;
};

export const guardarUbicacionEspacio = async (id, coordenadas) => {
    const response = await api.patch(`/espacios/${id}/ubicacion`, coordenadas);
    return response.data;
};

export const getReservasEspacio = async id => {
    const response = await api.get(`/espacios/${id}/reservas`);
    return response.data;
};

export const reservarEspacio = async (id, data) => {
    const response = await api.post(`/espacios/${id}/reservas`, data);
    return response.data;
};

export const cancelarReservaEspacio = async id => {
    const response = await api.patch(`/espacios/reservas/${id}/cancelar`);
    return response.data;
};
