import api from "./_api";

export const listarPagos = async () => {
    const response = await api.get("/pagos");
    return response.data;
};
