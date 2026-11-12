import { createContext, useContext, useEffect, useState } from "react";
import {
    getCurrentUser,
    logout as logoutService,
    obtenerRevisionSesion
} from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

    useEffect(() => {
        let mounted = true;
        const revisionInicial = obtenerRevisionSesion();

        const loadUser = async () => {
            if (!localStorage.getItem("token")) {
                return;
            }

            try {
                const user = await getCurrentUser();
                if (mounted && revisionInicial === obtenerRevisionSesion()) {
                    setUsuario(user);
                }
            } catch {
                if (mounted && revisionInicial === obtenerRevisionSesion()) {
                    setUsuario(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadUser();
        return () => {
            mounted = false;
        };
    }, []);

    const logout = () => {
        logoutService();
        setUsuario(null);
    };

    return (
        <AuthContext.Provider
            value={{
                usuario,
                setUsuario,
                logout,
                loading,
                autenticado: !!usuario
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
