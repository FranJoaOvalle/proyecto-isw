import api from "./_api";

export const getProfile = async () => {
    const response = await api.get("/usuarios/me");
    return response.data.usuario;
};

export const updateProfile = async (data) => {
    const response = await api.patch("/usuarios/me", data);
    return response.data.usuario;
};

export const changePassword = async (passwordActual, passwordNueva) => {
    const response = await api.patch("/usuarios/me/password", {
        passwordActual,
        passwordNueva
    });

    return response.data;
};

export const deactivateAccount = async () => {
    const response = await api.patch("/usuarios/me/desactivar");
    return response.data;
};