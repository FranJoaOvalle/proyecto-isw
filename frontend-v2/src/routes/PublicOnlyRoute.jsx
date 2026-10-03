import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import { useAuth } from "../contexts/AuthContext";

const getHomeByRole = (rol) => {
    switch (rol) {
        case "ADMIN":
            return "/admin";
        case "PRODUCTOR":
            return "/productor";
        case "CLIENTE":
            return "/cliente";
        default:
            return "/";
    }
};

export default function PublicOnlyRoute() {
    const { usuario, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" />
            </div>
        );
    }

    if (usuario)
        return <Navigate to={getHomeByRole(usuario.rol)} replace />;

    return <Outlet />;
}