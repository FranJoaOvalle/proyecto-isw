import api from "./_api";

export const getProductores = async () => {
    const response = await api.get("/productores");
    return response.data.productores;
};

export const createProductor = async (data) => {
    const response = await api.post("/productores", data);
    return response.data.productor;
};

export const updateProductor = async (id, data) => {
    const response = await api.patch(`/productores/${id}`, data);
    return response.data.productor;
};

export const cambiarEstadoProductor = async (id, activo) => {
    const response = await api.patch(`/productores/${id}/estado`, {
        activo
    });

    return response.data.productor;
};