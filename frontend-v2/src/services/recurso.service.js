import api from "./_api";

export const listarRecursos = async () => {
    const response = await api.get("/recursos");
    return response.data?.recursos ?? response.data?.items ?? response.data;
};
