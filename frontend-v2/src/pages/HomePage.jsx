import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Button,
    Card,
    Col,
    Container,
    Row,
    Spinner
} from "react-bootstrap";

import { useAuth } from "../contexts/AuthContext";
import { getTiposEvento } from "../services/tipoEvento.service";

import "./HomePage.css";

const paneles = {
    ADMIN: "/admin",
    PRODUCTOR: "/productor",
    CLIENTE: "/cliente"
};

const beneficios = [
    {
        icono: "calendar2-check",
        titulo: "Organización de eventos",
        descripcion: "Cotizamos el recinto, el personal y los equipos según la fecha y la cantidad de asistentes."
    },
    {
        icono: "people",
        titulo: "Producción de eventos",
        descripcion: "Un productor coordina al personal, los equipos y los horarios de montaje."
    },
    {
        icono: "clipboard-data",
        titulo: "Portal de clientes",
        descripcion: "En tu cuenta puedes revisar propuestas y consultar la fecha y el lugar de tus eventos contratados."
    }
];

const pasos = [
    {
        titulo: "Solicitud",
        descripcion: "Selecciona un servicio del catálogo e indica la fecha, el lugar y las características de tu evento."
    },
    {
        titulo: "Presupuesto",
        descripcion: "Recibirás una propuesta con el detalle de los servicios y sus precios."
    },
    {
        titulo: "Planificación",
        descripcion: "Cuando aceptes la propuesta, coordinaremos las reservas y el montaje."
    },
    {
        titulo: "Realización",
        descripcion: "El día del evento, el productor coordina al equipo en terreno."
    }
];

export default function HomePage() {
    const { usuario } = useAuth();

    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorCatalogo, setErrorCatalogo] = useState(false);

    useEffect(() => {
        let activo = true;

        getTiposEvento()
            .then(data => {
                if (activo) {
                    setEventos(
                        data.filter(e => e.activo !== false).slice(0, 3)
                    );
                }
            })
            .catch(() => {
                if (activo) setErrorCatalogo(true);
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    return (
        <main className="nes-home">
            <section className="home-hero">
                <Container>
                    <div className="home-hero-content">
                        <div className="home-eyebrow mb-3">
                            Organización y producción de eventos
                        </div>

                        <h1 className="home-hero-title">
                            NES Eventos
                        </h1>

                        <p className="home-hero-description">
                            Organizamos matrimonios, graduaciones y
                            encuentros de empresa en el Biobío. En el
                            catálogo puedes consultar los servicios y sus
                            precios de referencia.
                        </p>

                        <div className="d-flex flex-wrap gap-3 mt-4">
                            <Button
                                as={Link}
                                to="/catalogo"
                                size="lg"
                                variant="primary"
                            >
                                Ver catálogo
                                <i className="bi bi-arrow-right ms-2" />
                            </Button>

                            <Button
                                as={Link}
                                to={usuario
                                    ? paneles[usuario.rol] ?? "/"
                                    : "/register"}
                                size="lg"
                                variant="outline-light"
                            >
                                {usuario
                                    ? "Ir a mi panel"
                                    : "Crear cuenta"}
                            </Button>
                        </div>
                    </div>
                </Container>
            </section>

            <section className="home-section border-bottom">
                <Container>
                    <Row className="g-4">
                        {beneficios.map(item => (
                            <Col md={4} key={item.titulo}>
                                <div className="home-beneficio">
                                    <div className="home-icon">
                                        <i className={`bi bi-${item.icono}`} />
                                    </div>

                                    <h5 className="fw-bold mt-3">
                                        {item.titulo}
                                    </h5>

                                    <p className="text-secondary mb-0">
                                        {item.descripcion}
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            <section className="home-section">
                <Container>
                    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                        <div>
                            <div className="home-section-label">
                                Catálogo
                            </div>

                            <h2 className="fw-bold mb-2">
                                Servicios de producción
                            </h2>

                            <p className="text-secondary mb-0">
                                Cada ficha indica el mínimo de asistentes y los
                                servicios habituales.
                            </p>
                        </div>

                        <Button
                            as={Link}
                            to="/catalogo"
                            variant="outline-primary"
                        >
                            Ver catálogo completo
                            <i className="bi bi-arrow-right ms-2" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : errorCatalogo ? (
                        <p className="text-secondary">
                            No fue posible cargar el catálogo.
                        </p>
                    ) : eventos.length ? (
                        <Row className="g-4">
                            {eventos.map(evento => (
                                <Col md={6} lg={4} key={evento.id}>
                                    <Card
                                        as={Link}
                                        to="/catalogo"
                                        className="home-event-card h-100 text-decoration-none"
                                    >
                                        <div className="home-event-image">
                                            {evento.imagen_url && (
                                                <img
                                                    src={evento.imagen_url}
                                                    alt={evento.nombre}
                                                    loading="lazy"
                                                    onError={e => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            )}

                                            <i className="bi bi-calendar-event" />
                                        </div>

                                        <Card.Body className="p-4">
                                            <h5 className="fw-bold">
                                                {evento.nombre}
                                            </h5>

                                            {evento.descripcion && (
                                                <p className="text-secondary home-event-description">
                                                    {evento.descripcion}
                                                </p>
                                            )}

                                            <span className="text-primary fw-semibold small">
                                                Ver servicio
                                                <i className="bi bi-arrow-right ms-2" />
                                            </span>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p className="text-secondary">
                            No hay servicios disponibles actualmente.
                        </p>
                    )}
                </Container>
            </section>

            <section className="home-section bg-body-tertiary border-top border-bottom">
                <Container>
                    <div className="text-center mb-5">
                        <div className="home-section-label">
                            Contratación
                        </div>

                        <h2 className="fw-bold">
                            ¿Cómo contratar un evento?
                        </h2>

                        <p className="text-secondary">
                            Puedes revisar la propuesta en tu cuenta antes
                            de confirmar la contratación.
                        </p>
                    </div>

                    <Row className="g-4">
                        {pasos.map((paso, index) => (
                            <Col sm={6} lg={3} key={paso.titulo}>
                                <div className="home-step">
                                    <div className="home-step-number">
                                        {String(index + 1).padStart(2, "0")}
                                    </div>

                                    <h5 className="fw-bold mt-3">
                                        {paso.titulo}
                                    </h5>

                                    <p className="text-secondary mb-0">
                                        {paso.descripcion}
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            <section className="home-section">
                <Container>
                    <div className="home-cta">
                        <div>
                            <div className="home-section-label">
                                Cotizaciones
                            </div>

                            <h2 className="fw-bold">
                                Solicita un presupuesto
                            </h2>

                            <p className="text-secondary mb-0">
                                Indica cuántas personas asistirán y qué
                                servicios necesitas para que podamos cotizar.
                            </p>
                        </div>

                        <Button
                            as={Link}
                            to="/catalogo"
                            size="lg"
                            className="flex-shrink-0"
                        >
                            Consultar servicios
                            <i className="bi bi-arrow-right ms-2" />
                        </Button>
                    </div>
                </Container>
            </section>
        </main>
    );
}