import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ roles }) {
    const { usuario, loading } = useAuth();

    if (loading)
        return null;

    if (!usuario)
        return <Navigate to="/login" replace />;

    if (!roles.includes(usuario.rol))
        return <Navigate to="/dashboard" replace />;

    return <Outlet />;
}