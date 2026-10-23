import api from "./_api";

export const getAgenda = async (inicio, fin) => {
    const response = await api.get("/actividades/agenda", {
        params: {
            ...(inicio && { inicio }),
            ...(fin && { fin })
        }
    });

    return response.data;
};