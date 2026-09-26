import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
    const location = useLocation();
    const { usuario, loading } = useAuth();

    if (loading)
        return null;

    if (!usuario)
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );

    return <Outlet />;
}