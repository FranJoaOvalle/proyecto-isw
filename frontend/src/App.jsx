import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Catalogo from "./pages/Catalogo.jsx";

export default function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Dashboard />}
            />

            <Route
                path="/catalogo"
                element={<Catalogo />}
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>
    );
}