import axios from "axios";

const apiPublica = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 15000
});

export const consultarEncuestaPublica = async (token, signal) => {
    const response = await apiPublica.post(
        "/encuestas-publicas/consultar",
        { token },
        { signal }
    );

    return response.data;
};

export const responderEncuestaPublica = async (data) => {
    const response = await apiPublica.post(
        "/encuestas-publicas/responder",
        data
    );

    return response.data;
};