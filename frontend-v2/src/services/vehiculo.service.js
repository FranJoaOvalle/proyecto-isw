import api from "./_api";

export const getVehiculos = async (intervalo, incluirRetirados = false) => {
    const response = await api.get("/vehiculos", {
        params: {
            ...(intervalo ?? {}),
            ...(incluirRetirados ? { incluirRetirados: true } : {})
        }
    });
    return response.data;
};

export const getReservasVehiculo = async id => {
    const response = await api.get(`/vehiculos/${id}/reservas`);
    return response.data;
};

export const createVehiculo = async data => {
    const response = await api.post("/vehiculos", data);
    return response.data;
};

export const updateVehiculo = async (id, data) => {
    const response = await api.patch(`/vehiculos/${id}`, data);
    return response.data;
};

export const deleteVehiculo = async id => {
    const response = await api.delete(`/vehiculos/${id}`);
    return response.data;
};

export const reservarVehiculo = async (id, data) => {
    const response = await api.post(`/vehiculos/${id}/reservas`, data);
    return response.data;
};

export const cancelarReservaVehiculo = async id => {
    const response = await api.patch(`/vehiculos/reservas/${id}/cancelar`);
    return response.data;
};

export const registrarDevolucionVehiculo = async (vehiculoId, reservaId, data) => {
    const response = await api.patch(
        `/vehiculos/${vehiculoId}/reservas/${reservaId}/devolucion`,
        data
    );
    return response.data;
};
