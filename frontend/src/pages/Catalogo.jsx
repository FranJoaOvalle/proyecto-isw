
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatoPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(precio);
}

export default function Catalogo() {
    const navigate = useNavigate();

    const [servicios, setServicios] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [busqueda, setBusqueda] = useState("");
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

    // Controla si se muestra el formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Datos del formulario
    const [formulario, setFormulario] = useState({
        nombre: "",
        descripcion: "",
        precio_base: "",
        estado: true,
        id_categoria: ""
    });

    // Obtener categorías desde el backend
    useEffect(() => {
        cargarCategorias();
    }, []);

    async function cargarCategorias() {
        try {
            const respuesta = await fetch("http://localhost:3000/categorias");

            if (!respuesta.ok) {
                throw new Error("Error al obtener las categorías");
            }

            const datos = await respuesta.json();

            setCategorias(datos);

        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Obtener servicios desde el backend
    useEffect(() => {
        cargarServicios();
    }, []);

    async function cargarServicios() {
        try {
            const respuesta = await fetch("http://localhost:3000/servicios");

            if (!respuesta.ok) {
                throw new Error("Error al obtener los servicios");
            }

            const datos = await respuesta.json();

            setServicios(datos);

        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Cambiar valores del formulario
    function manejarCambio(e) {
        const { name, value } = e.target;

        setFormulario({
            ...formulario,
            [name]: value
        });
    }

    // Crear servicio
    async function crearServicio(e) {
        e.preventDefault();

        try {
            const respuesta = await fetch(
                "http://localhost:3000/servicios",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nombre: formulario.nombre,
                        descripcion: formulario.descripcion,
                        precio_base: Number(formulario.precio_base),
                        estado: formulario.estado === true || formulario.estado === "true",
                        id_categoria: Number(formulario.id_categoria)
                    })
                }
            );

            if (!respuesta.ok) {
                throw new Error("Error al crear el servicio");
            }

            // Volver a cargar los servicios
            await cargarServicios();

            // Limpiar formulario
            setFormulario({
                nombre: "",
                descripcion: "",
                precio_base: "",
                estado: true,
                id_categoria: ""
            });

            // Cerrar formulario
            setMostrarFormulario(false);

        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo crear el servicio");
        }
    }

    const serviciosFiltrados = servicios.filter((servicio) => {

        const coincideBusqueda =
            servicio.nombre
                .toLowerCase()
                .includes(busqueda.toLowerCase()) ||
            servicio.descripcion
                .toLowerCase()
                .includes(busqueda.toLowerCase());

        const coincideCategoria =
            categoriaSeleccionada === "Todas" ||
            servicio.id_categoria === Number(categoriaSeleccionada);

        return coincideBusqueda && coincideCategoria;
    });

    return (
        <div className="d-flex min-vh-100 bg-white">

            {/* Sidebar */}
            <aside
                className="bg-light border-end d-flex flex-column"
                style={{ width: "270px" }}
            >

                {/* Logo */}
                <div
                    className="d-flex align-items-center gap-2 px-4 border-bottom"
                    style={{ height: "82px" }}
                >
                    <div
                        className="bg-dark text-white rounded-3 d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: "40px", height: "40px" }}
                    >
                        NE
                    </div>

                    <span className="fw-semibold fs-5">
                        Nes Eventos
                    </span>
                </div>

                {/* Menú */}
                <nav className="p-3">

                    <button
                        onClick={() => navigate("/")}
                        className="btn btn-light text-secondary w-100 text-start d-flex align-items-center gap-3 mb-1"
                    >
                        <span className="fs-5">
                            ⌂
                        </span>

                        <span>
                            Inicio
                        </span>
                    </button>

                    <button
                        onClick={() => navigate("/catalogo")}
                        className="btn btn-dark w-100 text-start d-flex align-items-center gap-3 mb-1"
                    >
                        <span className="fs-5">
                            ▣
                        </span>

                        <span>
                            Catálogo
                        </span>
                    </button>

                </nav>

            </aside>

            {/* Contenido */}
            <div className="flex-grow-1">

                {/* Barra superior */}
                <header
                    className="border-bottom px-4 d-flex align-items-center"
                    style={{ height: "62px" }}
                >
                    <span className="text-secondary small">
                        Sábado, 26 de septiembre 2026
                    </span>
                </header>

                <main className="container-fluid px-5 py-4">

                    {/* Encabezado */}
                    <div className="d-flex justify-content-between align-items-start mb-4">

                        <div>
                            <h1 className="fw-bold mb-2">
                                Catálogo de servicios
                            </h1>

                            <p className="text-secondary mb-0">
                                Administra los servicios y precios base que ofrece Nes Eventos.
                            </p>
                        </div>

                        <button
                            className="btn btn-dark d-flex align-items-center gap-2"
                            onClick={() => setMostrarFormulario(true)}
                        >
                            <span>
                                +
                            </span>

                            Agregar servicio
                        </button>

                    </div>

                    {/* Formulario */}
                    {mostrarFormulario && (

                        <div className="card shadow-sm mb-4">

                            <div className="card-header bg-white d-flex justify-content-between align-items-center">

                                <h5 className="mb-0 fw-bold">
                                    Agregar servicio
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarFormulario(false)}
                                ></button>

                            </div>

                            <div className="card-body">

                                <form onSubmit={crearServicio}>

                                    <div className="row g-3">

                                        {/* Nombre */}
                                        <div className="col-md-6">

                                            <label className="form-label">
                                                Nombre
                                            </label>

                                            <input
                                                type="text"
                                                name="nombre"
                                                className="form-control"
                                                value={formulario.nombre}
                                                onChange={manejarCambio}
                                                required
                                            />

                                        </div>

                                        {/* Precio */}
                                        <div className="col-md-6">

                                            <label className="form-label">
                                                Precio base
                                            </label>

                                            <input
                                                type="number"
                                                name="precio_base"
                                                className="form-control"
                                                min="0"
                                                value={formulario.precio_base}
                                                onChange={manejarCambio}
                                                required
                                            />

                                        </div>

                                        {/* Descripción */}
                                        <div className="col-12">

                                            <label className="form-label">
                                                Descripción
                                            </label>

                                            <textarea
                                                name="descripcion"
                                                className="form-control"
                                                rows="3"
                                                value={formulario.descripcion}
                                                onChange={manejarCambio}
                                                required
                                            ></textarea>

                                        </div>

                                        {/* Categoría */}
                                        <div className="col-md-6">

                                            <label className="form-label">
                                                Categoría
                                            </label>

                                            <select
                                                name="id_categoria"
                                                className="form-select"
                                                value={formulario.id_categoria}
                                                onChange={manejarCambio}
                                                required
                                            >

                                                <option value="">
                                                    Seleccionar categoría
                                                </option>

                                                {categorias.map((categoria) => (

                                                    <option
                                                        key={categoria.id_categoria}
                                                        value={categoria.id_categoria}
                                                    >
                                                        {categoria.nombre}
                                                    </option>

                                                ))}

                                            </select>

                                        </div>

                                        {/* Estado */}
                                        <div className="col-md-6">

                                            <label className="form-label">
                                                Estado
                                            </label>

                                            <select
                                                name="estado"
                                                className="form-select"
                                                value={String(formulario.estado)}
                                                onChange={manejarCambio}
                                            >

                                                <option value="true">
                                                    Activo
                                                </option>

                                                <option value="false">
                                                    Inactivo
                                                </option>

                                            </select>

                                        </div>

                                    </div>

                                    {/* Botones */}
                                    <div className="d-flex justify-content-end gap-2 mt-4">

                                        <button
                                            type="button"
                                            className="btn btn-light border"
                                            onClick={() => setMostrarFormulario(false)}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-dark"
                                        >
                                            Crear servicio
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    )}

                    {/* Información del catálogo */}
                    <div className="alert alert-light border mb-4">

                        <div className="d-flex gap-3">

                            <span className="fs-5">
                                ⓘ
                            </span>

                            <div>
                                <strong>
                                    Catálogo de servicios.
                                </strong>

                                <span className="text-secondary ms-1">
                                    Aquí se definen los servicios ofrecidos por Nes Eventos
                                    y sus precios base. Estos valores sirven como referencia
                                    para la gestión y elaboración de presupuestos.
                                </span>
                            </div>

                        </div>

                    </div>

                    {/* Buscador y categorías */}
                    <div className="row g-3 mb-4">

                        <div className="col-lg-7">

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    🔍
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar servicio..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />

                            </div>

                        </div>

                        <div className="col-lg-5">

                            <div className="d-flex gap-2 flex-wrap justify-content-lg-end">

                                <button
                                    onClick={() => setCategoriaSeleccionada("Todas")}
                                    className={
                                        categoriaSeleccionada === "Todas"
                                            ? "btn btn-dark"
                                            : "btn btn-light border"
                                    }
                                >
                                    Todas
                                </button>

                                {categorias.map((categoria) => (

                                    <button
                                        key={categoria.id_categoria}
                                        onClick={() =>
                                            setCategoriaSeleccionada(
                                                categoria.id_categoria
                                            )
                                        }
                                        className={
                                            categoriaSeleccionada === categoria.id_categoria
                                                ? "btn btn-dark"
                                                : "btn btn-light border"
                                        }
                                    >
                                        {categoria.nombre}
                                    </button>

                                ))}

                            </div>

                        </div>

                    </div>

                    {/* Cantidad */}
                    <div className="mb-3">

                        <span className="text-secondary">
                            {serviciosFiltrados.length} servicios
                        </span>

                    </div>

                    {/* Servicios */}
                    <div className="row g-4">

                        {serviciosFiltrados.map((servicio) => {

                            const categoria = categorias.find(
                                (cat) =>
                                    cat.id_categoria === servicio.id_categoria
                            );

                            return (

                                <div
                                    className="col-xl-3 col-lg-4 col-md-6"
                                    key={servicio.id_servicio}
                                >

                                    <div className="card h-100 shadow-sm">

                                        <div
                                            className="bg-dark text-white d-flex align-items-end p-3"
                                            style={{ height: "170px" }}
                                        >
                                            <div>

                                                <span className="badge bg-light text-dark mb-2">
                                                    {categoria?.nombre || "Sin categoría"}
                                                </span>

                                                <div className="small text-white-50">
                                                    Servicio de catálogo
                                                </div>

                                            </div>
                                        </div>

                                        <div className="card-body d-flex flex-column">

                                            <div className="d-flex justify-content-between align-items-start gap-2">

                                                <h5 className="fw-bold mb-2">
                                                    {servicio.nombre}
                                                </h5>

                                                {servicio.estado ? (
                                                    <span className="badge text-bg-success">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge text-bg-secondary">
                                                        Inactivo
                                                    </span>
                                                )}

                                            </div>

                                            <p className="text-secondary mb-3">
                                                {servicio.descripcion}
                                            </p>

                                            <div className="bg-light rounded-3 p-3 mb-3">

                                                <small className="text-secondary d-block">
                                                    Precio base
                                                </small>

                                                <strong className="fs-4">
                                                    {formatoPrecio(servicio.precio_base)}
                                                </strong>

                                            </div>

                                            <div className="d-flex gap-2 mt-auto">

                                                <button
                                                    className="btn btn-dark flex-grow-1"
                                                >
                                                    Ver detalles
                                                </button>

                                                <button
                                                    className="btn btn-light border"
                                                    title="Editar servicio"
                                                >
                                                    ✎
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            );
                        })}

                    </div>

                    {/* Sin resultados */}
                    {serviciosFiltrados.length === 0 && (

                        <div className="text-center py-5">

                            <h5>
                                No se encontraron servicios
                            </h5>

                            <p className="text-secondary">
                                Intenta cambiar la búsqueda o la categoría seleccionada.
                            </p>

                        </div>

                    )}

                </main>

            </div>

        </div>
    );
}

