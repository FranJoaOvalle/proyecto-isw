import {useState} from 'react';
import {Link, useLocation, useNavigate} from "react-router-dom";
import { login } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUsuario } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login(email, password);
            setUsuario(result.usuario);

            navigate(from === "/" ? "/dashboard" : from, { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                "No fue posible iniciar sesión."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={"min-h-screen relative lg:flex"}>


            <div className={"relative z-10 min-h-screen w-full flex items-center justify-center px-6 " +
                "lg:min-h-screen lg:w-1/3 lg:bg-white"}>
                <div className={"w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-md " +
                    "lg:rounded-none lg:bg-transparent lg:p-12 lg:shadow-none lg:backdrop-blur-none"}>

                    <div className={"mb-8"}>
                        <div className={"mb-8"}>
                            <span className={"text-2xl font-bold text-blue-600"}>
                                Organizadora de eventos
                            </span>
                        </div>

                        <h1 className={"text-3xl font-bold tracking-tight text-gray-900"}>
                            Bienvenido de nuevo
                        </h1>

                        <p className={"mt-2 text-sm text-gray-500"}>
                            Inicia sesión para continuar a tu cuenta.
                        </p>
                    </div>

                    {error && (
                        <div className={"mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={"space-y-6"}>
                        <div>
                            <label
                                htmlFor={"email"}
                                className={"block text-sm font-medium text-gray-700"}
                            >
                                Correo
                            </label>

                            <input
                                id={"email"}
                                name={"email"}
                                type={"email"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={"correo@ejemplo.com"}
                                autoComplete={"email"}
                                required
                                className={"mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 " +
                                    "outline-none transition placeholder:text-gray-400 focus:border-blue-600 " +
                                    "focus:ring-2 focus:ring-blue-600/20"}
                            />
                        </div>

                        <div>
                            <div className={"flex items-center justify-between"}>
                                <label
                                    htmlFor={"password"}
                                    className={"text-sm font-medium text-gray-700"}
                                >
                                    Contraseña
                                </label>

                                <Link
                                    to={"/forgot-password"}
                                    className={"text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"}
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <input
                                id={"password"}
                                name={"password"}
                                type={"password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={"••••••••••"}
                                autoComplete={"current-password"}
                                required
                                className={"mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 " +
                                    "outline-none transition placeholder:text-gray-400 focus:border-blue-600 " +
                                    "focus:ring-2 focus:ring-blue-600/20"}
                            />
                        </div>

                        <button
                            type={"submit"}
                            disabled={loading}
                            className={"w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white " +
                                "transition hover:bg-blue-700 focus:outline-none focus:ring-2 " +
                                "focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed " +
                                "disabled:opacity-60"}
                        >
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>

                        <div className={"text-center text-sm text-gray-600"}>
                            ¿Aún no tienes una cuenta?{" "}
                            <Link
                                to={"/register"}
                                className={"font-semibold text-blue-600 hover:text-blue-700 hover:underline"}
                            >
                                Regístrate
                            </Link>
                        </div>

                        <button
                            type={"button"}
                            onClick={() => navigate("/")}
                            className={"mx-auto flex items-center gap-2 text-sm font-medium " +
                                "text-gray-600 hover:text-gray-900"}
                        >
                            ← Volver
                        </button>
                    </form>
                </div>
            </div>

            <div className={"absolute inset-0 lg:relative lg:w-2/3"}>
                <img
                    src={"/assets/img/login.webp"}
                    alt={"Login"}
                    className={"w-full h-full object-cover"}
                />
                <div className={"absolute inset-0 bg-black/40 lg:hidden"}/>
            </div>
        </div>
    );
}