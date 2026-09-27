import api from "./api";

export const getRecursos = async () => {
    const response = await api.get("/recursos");
    return response.data;
};
