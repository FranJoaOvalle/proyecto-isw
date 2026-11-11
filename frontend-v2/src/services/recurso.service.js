import api from "./_api";

export const getRecursos = async (incluirInactivos = true, intervalo) => {
    const response = await api.get(intervalo ? "/recursos/disponibilidad" : "/recursos", {
        params: {
            ...(incluirInactivos ? { incluirInactivos: true } : {}),
            ...(intervalo ?? {})
        }
    });
    return response.data;
};

export const createRecurso = async data => {
    const response = await api.post("/recursos", data);
    return response.data;
};

export const updateRecurso = async (id, data) => {
    const response = await api.patch(`/recursos/${id}`, data);
    return response.data;
};

export const updateRecursoEstado = async (id, activo) => {
    const response = await api.patch(`/recursos/${id}/estado`, { activo });
    return response.data;
};

export const deleteRecurso = async id => {
    const response = await api.delete(`/recursos/${id}`);
    return response.data;
};

export const getReservasRecurso = async id => {
    const response = await api.get(`/recursos/${id}/reservas`);
    return response.data;
};

export const reservarRecurso = async (id, data) => {
    const response = await api.post(`/recursos/${id}/reservas`, data);
    return response.data;
};

export const cancelarReservaRecurso = async id => {
    const response = await api.patch(`/recursos/reservas/${id}/cancelar`);
    return response.data;
};

export const registrarDevolucionRecurso = async (recursoId, reservaId, data) => {
    const response = await api.patch(
        `/recursos/${recursoId}/reservas/${reservaId}/devolucion`,
        data
    );
    return response.data;
};
