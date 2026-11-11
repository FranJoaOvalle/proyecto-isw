import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Badge, Button, Card, ListGroup, Spinner } from "react-bootstrap";
import { guardarUbicacionEspacio } from "../../services/espacio.service";
import NotificacionToast from "./NotificacionToast";
import "leaflet/dist/leaflet.css";

function estadoEspacio(espacio) {
    if (!espacio.habilitado) return { texto: "Deshabilitado", color: "#6c757d", badge: "secondary" };
    if (espacio.disponible == null) return { texto: "Consulta una fecha", color: "#6f42c1", badge: "primary" };
    return espacio.disponible
        ? { texto: "Disponible", color: "#198754", badge: "success" }
        : { texto: "Reservado", color: "#dc3545", badge: "danger" };
}

function AjustarMapa({ posicion, puntos }) {
    const mapa = useMap();

    useEffect(() => {
        if (posicion) mapa.flyTo(posicion, 15, { duration: 0.45 });
        else if (puntos.length === 1) mapa.setView(puntos[0], 13);
        else if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [28, 28], maxZoom: 13 });
    }, [mapa, posicion, puntos]);

    return null;
}

export default function MapaEspacios({ espacios, onReservas, onUbicacionGuardada }) {
    const [geocodificando, setGeocodificando] = useState(false);
    const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
    const [aviso, setAviso] = useState("");
    const [seleccionado, setSeleccionado] = useState(null);
    const controladorRef = useRef(null);

    const espaciosUbicados = useMemo(
        () => espacios.filter(espacio => Number.isFinite(espacio.latitud) && Number.isFinite(espacio.longitud)),
        [espacios]
    );
    const puntos = useMemo(
        () => espaciosUbicados.map(espacio => [espacio.latitud, espacio.longitud]),
        [espaciosUbicados]
    );
    const espacioSeleccionado = espacios.find(espacio => espacio.id === seleccionado);
    const posicionSeleccionada = espacioSeleccionado && Number.isFinite(espacioSeleccionado.latitud)
        ? [espacioSeleccionado.latitud, espacioSeleccionado.longitud]
        : null;
    const pendientes = espacios.filter(espacio => !Number.isFinite(espacio.latitud) || !Number.isFinite(espacio.longitud));

    useEffect(() => () => controladorRef.current?.abort(), []);

    const ubicarEspacios = async () => {
        if (geocodificando || pendientes.length === 0) return;

        const controlador = new AbortController();
        controladorRef.current = controlador;
        setGeocodificando(true);
        setAviso("");
        setProgreso({ actual: 0, total: pendientes.length });

        let encontrados = 0;
        for (const [indice, espacio] of pendientes.entries()) {
            if (controlador.signal.aborted) break;
            let coordenadas = null;

            try {
                const url = new URL("https://nominatim.openstreetmap.org/search");
                url.search = new URLSearchParams({
                    q: espacio.direccion,
                    format: "jsonv2",
                    limit: "1"
                }).toString();
                const respuesta = await fetch(url, {
                    headers: { Accept: "application/json" },
                    signal: controlador.signal
                });
                if (!respuesta.ok) throw new Error("No fue posible consultar OpenStreetMap.");
                const resultados = await respuesta.json();
                if (resultados[0]) {
                    const lat = Number(resultados[0].lat);
                    const lon = Number(resultados[0].lon);
                    if (Number.isFinite(lat) && Number.isFinite(lon)) coordenadas = [lat, lon];
                }
            } catch (error) {
                if (controlador.signal.aborted) break;
                console.warn("No se pudo ubicar una dirección de espacio.", error);
            }

            if (controlador.signal.aborted) break;
            if (coordenadas) {
                try {
                    await guardarUbicacionEspacio(espacio.id, {
                        latitud: coordenadas[0],
                        longitud: coordenadas[1]
                    });
                    encontrados += 1;
                    await onUbicacionGuardada();
                } catch (errorGuardado) {
                    console.warn("No se pudo guardar la ubicación del espacio.", errorGuardado);
                }
            }
            setProgreso({ actual: indice + 1, total: pendientes.length });

            if (indice < pendientes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
        }

        if (!controlador.signal.aborted) {
            const sinResultado = pendientes.length - encontrados;
            const textoUbicados = encontrados === 1 ? "espacio ubicado" : "espacios ubicados";
            const textoPendientes = sinResultado === 1 ? "espacio pendiente" : "espacios pendientes";
            setAviso(sinResultado
                ? `${encontrados} ${textoUbicados}. No se encontró la dirección de ${sinResultado} ${textoPendientes}; puedes corregirla y volver a intentar.`
                : `${encontrados} ${textoUbicados} correctamente.`);
            setGeocodificando(false);
            controladorRef.current = null;
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-3">
                    <div>
                        <h3 className="h5 fw-bold mb-1">Mapa de espacios</h3>
                        <p className="text-secondary mb-0">
                            Explora los recintos y revisa su estado de disponibilidad.
                        </p>
                    </div>
                    <Button
                        onClick={ubicarEspacios}
                        disabled={geocodificando || pendientes.length === 0}
                        title="Envía las direcciones pendientes a Nominatim de OpenStreetMap para obtener coordenadas."
                        aria-label="Enviar direcciones pendientes a OpenStreetMap y ubicarlas en el mapa"
                    >
                        {geocodificando
                            ? <><Spinner size="sm" className="me-2" />Ubicando {progreso.actual}/{progreso.total}…</>
                            : <><i className="bi bi-geo-alt me-2" />{espaciosUbicados.length ? "Ubicar pendientes en OpenStreetMap" : "Ubicar en OpenStreetMap"}</>}
                    </Button>
                </div>

                <NotificacionToast
                    mensaje={aviso}
                    tipo={aviso.includes("No se encontró") ? "warning" : "success"}
                    onClose={() => setAviso("")}
                />

                <div className="row g-3">
                    <div className="col-12 col-xl-8">
                        {puntos.length ? (
                            <MapContainer center={puntos[0]} zoom={12} scrollWheelZoom className="w-100 rounded-3 border" style={{ height: 460 }}>
                                <AjustarMapa posicion={posicionSeleccionada} puntos={puntos} />
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {espaciosUbicados.map(espacio => {
                                    const estado = estadoEspacio(espacio);
                                    return (
                                        <CircleMarker
                                            key={espacio.id}
                                            center={[espacio.latitud, espacio.longitud]}
                                            radius={10}
                                            pathOptions={{ color: "#fff", weight: 3, fillColor: estado.color, fillOpacity: 0.95 }}
                                            eventHandlers={{ click: () => setSeleccionado(espacio.id) }}
                                        >
                                            <Popup>
                                                <div className="small">
                                                    <strong>{espacio.nombre}</strong>
                                                    <div>{espacio.direccion}</div>
                                                    <div>{espacio.capacidad.toLocaleString("es-CL")} personas · {estado.texto}</div>
                                                    <Button size="sm" variant="link" className="px-0 pb-0" onClick={() => onReservas(espacio)}>
                                                        Ver reservas
                                                    </Button>
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    );
                                })}
                            </MapContainer>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center text-center border rounded-3 bg-body-tertiary p-5" style={{ minHeight: 460 }}>
                                <div>
                                    <i className="bi bi-map display-5 text-primary" />
                                    <p className="fw-semibold mt-3 mb-1">{geocodificando ? "Buscando ubicaciones…" : "Todavía no hay ubicaciones en el mapa"}</p>
                                    <p className="text-secondary mb-0">Usa «Ubicar en OpenStreetMap» para buscar las direcciones registradas.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-12 col-xl-4">
                        <div className="d-flex flex-wrap gap-2 mb-2" aria-label="Leyenda de disponibilidad">
                            {[{ texto: "Disponible", variante: "success" }, { texto: "Reservado", variante: "danger" }, { texto: "Deshabilitado", variante: "secondary" }, { texto: "Consulta una fecha", variante: "primary" }].map(item => (
                                <Badge bg={item.variante} key={item.texto}>{item.texto}</Badge>
                            ))}
                        </div>
                        <ListGroup variant="flush" className="border rounded-3 overflow-auto" style={{ maxHeight: 420 }}>
                            {espacios.map(espacio => {
                                const estado = estadoEspacio(espacio);
                                const tieneUbicacion = Number.isFinite(espacio.latitud) && Number.isFinite(espacio.longitud);
                                return (
                                    <ListGroup.Item
                                        className={seleccionado === espacio.id ? "espacio-mapa-seleccionado" : ""}
                                        action={tieneUbicacion}
                                        key={espacio.id}
                                        onClick={() => tieneUbicacion && setSeleccionado(espacio.id)}
                                        aria-current={seleccionado === espacio.id ? "true" : undefined}
                                    >
                                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2">
                                            <strong className="text-break">{espacio.nombre}</strong>
                                            <Badge bg={estado.badge} className="align-self-start flex-shrink-0">
                                                {estado.texto === "Consulta una fecha" ? "Disponibilidad pendiente" : estado.texto}
                                            </Badge>
                                        </div>
                                        <div className="small text-secondary">{espacio.direccion}</div>
                                        <div className="small text-secondary mt-1">
                                            {espacio.capacidad.toLocaleString("es-CL")} personas
                                            {!tieneUbicacion && <span> · {geocodificando ? "Pendiente…" : "Sin ubicar"}</span>}
                                        </div>
                                    </ListGroup.Item>
                                );
                            })}
                            {espacios.length === 0 && <ListGroup.Item className="text-secondary">No hay espacios que mostrar.</ListGroup.Item>}
                        </ListGroup>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
