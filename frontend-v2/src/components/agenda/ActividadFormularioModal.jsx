import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { TIPOS_ACTIVIDAD } from "./agenda.utils";

export default function ActividadFormularioModal({ agenda }) {
    const { esAdmin, mostrarFormulario, setMostrarFormulario, guardandoActividad, guardarActividad, actividadEditando, formActividad, setFormActividad, cargandoProductores, productores, productoresActividad, cambiarProductorAsignado, cambiarResponsable, error } = agenda;

    return (
        <>            {/* Formulario para crear o editar actividades */}
            <Modal
                show={mostrarFormulario}
                onHide={() => {
                    if (!guardandoActividad) {
                        setMostrarFormulario(false);
                    }
                }}
                centered
            >
                <Form onSubmit={guardarActividad}>
                    <Modal.Header closeButton={!guardandoActividad}>
                        <Modal.Title>
                            {actividadEditando
                                ? "Editar actividad"
                                : "Nueva actividad"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Título *</Form.Label>
                            <Form.Control
                                required
                                minLength={2}
                                maxLength={100}
                                value={formActividad.titulo}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        titulo: e.target.value
                                    })
                                }
                                placeholder="Ej. Reunión de coordinación"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                maxLength={2000}
                                value={formActividad.descripcion}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        descripcion: e.target.value
                                    })
                                }
                                placeholder="Describe las tareas o el objetivo de la actividad"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de actividad *</Form.Label>
                            <Form.Select
                                required
                                value={formActividad.tipo}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        tipo: e.target.value
                                    })
                                }
                            >
                                {TIPOS_ACTIVIDAD.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        {esAdmin && actividadEditando && (
                            <Form.Group className="mb-3">
                                <Form.Label>Estado de la actividad *</Form.Label>
                                <Form.Select
                                    value={formActividad.estado}
                                    onChange={(e) =>
                                        setFormActividad((anterior) => ({
                                            ...anterior,
                                            estado: e.target.value
                                        }))
                                    }
                                >
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="COMPLETADA">Completada</option>
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Inicio *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={formActividad.inicio}
                                        onChange={(e) =>
                                            setFormActividad({
                                                ...formActividad,
                                                inicio: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Término *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={formActividad.fin}
                                        onChange={(e) =>
                                            setFormActividad({
                                                ...formActividad,
                                                fin: e.target.value
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Lugar</Form.Label>
                            <Form.Control
                                maxLength={200}
                                value={formActividad.lugar}
                                onChange={(e) =>
                                    setFormActividad({
                                        ...formActividad,
                                        lugar: e.target.value
                                    })
                                }
                                placeholder="Lugar donde se realizará"
                            />
                        </Form.Group>

                        {esAdmin ? (
                            <Form.Group className="mb-3">
                                <Form.Label>Productores asignados *</Form.Label>

                                {cargandoProductores ? (
                                    <div className="d-flex align-items-center gap-2 text-secondary py-2">
                                        <Spinner size="sm" />
                                        <span className="small">
                                            Cargando productores...
                                        </span>
                                    </div>
                                ) : productores.length === 0 ? (
                                    <Alert variant="warning" className="mb-0">
                                        No hay productores activos disponibles.
                                    </Alert>
                                ) : (
                                    <div className="border rounded-3 px-3">
                                        {productores.map((productor) => {
                                            const asignado =
                                                productoresActividad.find(
                                                    (item) =>
                                                        item.productorId === productor.id
                                                );

                                            return (
                                                <div
                                                    key={productor.id}
                                                    className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 border-bottom"
                                                >
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`productor-${productor.id}`}
                                                        label={`${productor.nombres} ${productor.apellidos}`}
                                                        checked={Boolean(asignado)}
                                                        onChange={(e) =>
                                                            cambiarProductorAsignado(
                                                                productor.id,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />

                                                    {asignado && (
                                                        <Form.Check
                                                            type="radio"
                                                            name="productorResponsable"
                                                            id={`responsable-${productor.id}`}
                                                            label="Responsable"
                                                            checked={asignado.esResponsable}
                                                            onChange={() =>
                                                                cambiarResponsable(productor.id)
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <Form.Text className="text-body-secondary">
                                    Selecciona al menos un productor y marca
                                    exactamente uno como responsable. El primero
                                    seleccionado queda como responsable inicialmente.
                                </Form.Text>
                            </Form.Group>
                        ) : (
                            <Alert variant="info" className="mb-0">
                                La actividad se asignará automáticamente a tu cuenta.
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="danger" className="mt-3 mb-0">
                                {error}
                            </Alert>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setMostrarFormulario(false)}
                            disabled={guardandoActividad}
                        >
                            Cerrar
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                guardandoActividad ||
                                (esAdmin && !actividadEditando &&
                                    (cargandoProductores || productores.length === 0))
                            }
                        >
                            {guardandoActividad ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar actividad"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </>
    );
}
