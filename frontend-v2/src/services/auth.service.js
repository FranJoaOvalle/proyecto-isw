import api from "./_api";

let revisionSesion = 0;

export const obtenerRevisionSesion = () => revisionSesion;

export const login = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password
    });
    const token = response.data?.token;
    if (typeof token !== "string" || !token) {
        throw new Error("El servidor no devolvió un token de sesión válido.");
    }
    revisionSesion += 1;
    localStorage.setItem("token", token);
    return response.data;
};

export const register = async (data) => {
    const response = await api.post("/auth/registro", data);
    return response.data;
};

export const logout = () => {
    revisionSesion += 1;
    localStorage.removeItem("token");
};

export const getCurrentUser = async () => {
    const tokenSolicitado = localStorage.getItem("token");
    const revisionSolicitada = revisionSesion;

    try {
        const response = await api.get("/usuarios/me");
        return response.data.usuario;
    } catch (error) {
        const mismoIntentoDeSesion =
            tokenSolicitado &&
            revisionSolicitada === revisionSesion &&
            localStorage.getItem("token") === tokenSolicitado;

        if (error.response?.status === 401 && mismoIntentoDeSesion) {
            logout();
        }

        throw error;
    }
};

export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", {
        email
    });
    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await api.post("/auth/reset-password", {
        token,
        password
    });
    return response.data;
};
