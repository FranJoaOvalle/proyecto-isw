import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ roles }) {
    const { usuario, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!usuario)
        return <Navigate to="/login" state={{ from: location }} replace />;

    if (roles && !roles.includes(usuario.rol))
        return <Navigate to="/" replace />;

    return <Outlet />;
}