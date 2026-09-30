import api from "./api";

export const getCategorias = async (incluirInactivos = false) => {
    const response = await api.get("/categorias", {
        params: incluirInactivos
            ? { incluirInactivos: true }
            : {}
    });

    return response.data;
};

export const getCategoriaById = async id => {
    const response = await api.get(`/categorias/${id}`);

    return response.data;
};

export const createCategoria = async data => {
    const response = await api.post("/categorias", data);

    return response.data;
};

export const updateCategoria = async (id, data) => {
    const response = await api.put(`/categorias/${id}`, data);

    return response.data;
};

export const deactivateCategoria = async id => {
    const response = await api.delete(`/categorias/${id}`);

    return response.data;
};

export const reactivateCategoria = async id => {
    const response = await api.patch(
        `/categorias/${id}/reactivar`
    );

    return response.data;
};