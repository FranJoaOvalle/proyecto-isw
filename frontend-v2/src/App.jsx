import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

import HomePage from "./pages/HomePage";
import CatalogoPage from "./pages/CatalogoPage";
import ProfilePage from "./pages/ProfilePage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import AdminPage from "./pages/admin/AdminPage";
import ClientesPage from "./pages/admin/ClientesPage";
import ProductoresPage from "./pages/admin/ProductoresPage";

import ProductorPage from "./pages/productor/ProductorPage";
import ClientePage from "./pages/cliente/ClientePage";

export default function App() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalogo" element={<CatalogoPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/perfil" element={<ProfilePage />} />
                </Route>

                <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin/clientes" element={<ClientesPage />} />
                        <Route path="/admin/productores" element={<ProductoresPage />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute roles={["PRODUCTOR"]} />}>
                    <Route path="/productor" element={<ProductorPage />} />
                </Route>

                <Route element={<ProtectedRoute roles={["CLIENTE"]} />}>
                    <Route path="/cliente" element={<ClientePage />} />
                </Route>
            </Route>

            <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}