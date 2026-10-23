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
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import AdminPage from "./pages/admin/AdminPage";
import ClientesPage from "./pages/admin/ClientesPage";
import ProductoresPage from "./pages/admin/ProductoresPage";
import CatalogoAdminPage from "./pages/admin/CatalogoAdminPage";
import RecursosPage from "./pages/admin/RecursosPage.jsx";
import EventosPage from "./pages/admin/EventosPage.jsx";
import PresupuestosPage from "./pages/admin/PresupuestosPage.jsx";
import PagosPage from "./pages/admin/PagosPage.jsx";
import AgendaPage from "./pages/admin/AgendaPage.jsx";

import ProductorPage from "./pages/productor/ProductorPage";
import EventosProductorPage from "./pages/productor/EventosProductorPage.jsx";

import ClientePage from "./pages/cliente/ClientePage";
import CompraContratoPage from "./pages/cliente/CompraContratoPage";
import MisEventosPage from "./pages/cliente/MisEventosPage.jsx";

import EventoDetallePage from "./pages/admin/EventoDetallePage.jsx";
import EventoProductorDetallePage from "./pages/productor/EventoProductorDetallePage.jsx";
import EventoClienteDetallePage from "./pages/cliente/EventoClienteDetallePage.jsx";

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
                        <Route
                            path="/admin/eventos/:id"
                            element={<EventoDetallePage />}
                        />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin/agenda" element={<AgendaPage />} />
                        <Route path="/admin/clientes" element={<ClientesPage />} />
                        <Route
                            path="/admin/productores"
                            element={<ProductoresPage />}
                        />
                        <Route
                            path="/admin/catalogo"
                            element={<CatalogoAdminPage />}
                        />
                        <Route path="/admin/eventos" element={<EventosPage />} />
                        <Route path="/admin/recursos" element={<RecursosPage />} />
                        <Route
                            path="/admin/presupuestos"
                            element={<PresupuestosPage />}
                        />
                        <Route path="/admin/pagos" element={<PagosPage />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute roles={["PRODUCTOR"]} />}>
                    <Route
                        path="/productor/eventos/:id"
                        element={<EventoProductorDetallePage />}
                    />
                    <Route path="/productor" element={<ProductorPage />} />
                    <Route
                        path="/productor/eventos"
                        element={<EventosProductorPage />}
                    />
                </Route>

                <Route element={<ProtectedRoute roles={["CLIENTE"]} />}>
                    <Route
                        path="/cliente/eventos/:id"
                        element={<EventoClienteDetallePage />}
                    />
                    <Route path="/cliente" element={<ClientePage />} />
                    <Route
                        path="/cliente/compra"
                        element={<CompraContratoPage />}
                    />
                    <Route path="/cliente/eventos" element={<MisEventosPage />} />
                </Route>
            </Route>

            <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}