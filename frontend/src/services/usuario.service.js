import api from "./api";

export const getGestores = async () => {
    const response = await api.get("/usuarios/gestores");
    return response.data;
};