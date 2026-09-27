import api from "./api";

export const updateRecurso = async (id, data) => {
    const response = await api.put(`/recursos/${id}`, data);
    return response.data;
};

export const createRecurso = async data => {
    const response = await api.post("/recursos", data);
    return response.data;
};

export const getRecursos = async () => {
    const response = await api.get("/recursos");
    return response.data;
};
