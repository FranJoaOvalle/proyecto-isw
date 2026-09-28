import api from "./api";

export const getServicios = async (incluirInactivos = false) => {
    const response = await api.get("/servicios", {
        params: { incluirInactivos }
    });

    return response.data;
};

export const getServicio = async id => {
    const response = await api.get(`/servicios/${id}`);
    return response.data;
};

export const createServicio = async data => {
    const response = await api.post("/servicios", data);
    return response.data;
};

export const updateServicio = async (id, data) => {
    const response = await api.put(`/servicios/${id}`, data);
    return response.data;
};

export const deactivateServicio = async id => {
    const response = await api.delete(`/servicios/${id}`);
    return response.data;
};

export const reactivateServicio = async id => {
    const response = await api.patch(`/servicios/${id}/reactivar`);
    return response.data;
};