import api from "./_api";
export const listarSolicitudes = async (params) => {
    const response = await api.get("/solicitudes", { params });

    return response.data;
};

export const obtenerSolicitud = async (id) => {
    const response = await api.get(`/solicitudes/${id}`);

    return response.data;
};

export const historialSolicitud = async (id) => {
    const response = await api.get(`/solicitudes/${id}/historial`);

    return response.data;
};

export const crearSolicitud = async (datos) => {
    const response = await api.post("/solicitudes", datos);

    return response.data;
};

export const editarSolicitud = async (id, datos) => {
    const response = await api.patch(`/solicitudes/${id}`, datos);

    return response.data;
};

export const revisarSolicitud = async (id) => {
    const response = await api.post(`/solicitudes/${id}/revision`);

    return response.data;
};

export const cerrarSolicitud = async (id, motivo, retiro) => {
    const response = await api.post(
        `/solicitudes/${id}/${retiro ? "retiro" : "rechazo"}`,
        { motivo }
    );

    return response.data;
};
