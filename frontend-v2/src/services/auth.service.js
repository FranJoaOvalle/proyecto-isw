import api from "./_api";

export const login = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password
    });
    localStorage.setItem("token", response.data.token);
    return response.data;
};

export const register = async (data) => {
    const response = await api.post("/auth/registro", data);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
};

export const getCurrentUser = async () => {
    const response = await api.get("/usuarios/me");
    return response.data.usuario;
};