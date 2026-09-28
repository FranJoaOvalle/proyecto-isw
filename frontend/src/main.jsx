import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Personal from "./pages/Personal.jsx";
import Servicios from "./pages/Servicios.jsx";
import Recursos from "./pages/Recursos.jsx";
import Eventos from './pages/Eventos.jsx';

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route element={<RoleRoute roles={["ADMIN", "OPERACIONES_LOGISTICA", "BODEGA"]} />}>
                            <Route path="/recursos" element={<Recursos />} />
                        </Route>

                        <Route
                            element={
                                <RoleRoute
                                    roles={["ADMIN", "PRODUCCION", "COMERCIAL"]}
                                />
                            }
                        >
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/personal" element={<Personal />} />
                            <Route path="/servicios" element={<Servicios />} />
                        </Route>

                            <Route
                                element={
                                    <RoleRoute
                                        roles={["ADMIN", "PRODUCCION", "COMERCIAL", "CLIENTE"]}
                                    />
                                }
                            >
                                <Route path="/eventos" element={<Eventos />} />
                            </Route>

                        </Route>
                    
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
