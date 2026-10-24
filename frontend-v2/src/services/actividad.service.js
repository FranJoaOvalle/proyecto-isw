import api from "./_api";

export const crearActividad = async (datos) => {
    const response = await api.post("/actividades", datos);
    return response.data;
};

export const actualizarActividad = async (id, datos) => {
    const response = await api.patch(`/actividades/${id}`, datos);
    return response.data;
};

export const cancelarActividad = async (id) => {
    const response = await api.delete(`/actividades/${id}`);
    return response.data;
};

export const cambiarEstadoActividad = async (id, estado) => {
    const response = await api.patch(`/actividades/${id}/estado`, {
        estado
    });

    return response.data;
};

export const eliminarFisicamenteActividad = async (id) => {
    const response = await api.delete(`/actividades/${id}/fisico`);
    return response.data;
};