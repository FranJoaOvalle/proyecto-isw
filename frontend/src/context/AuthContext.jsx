import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as logoutService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await getCurrentUser();
                setUsuario(user);
            } catch {
                setUsuario(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const logout = () => {
        logoutService();
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, setUsuario, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);