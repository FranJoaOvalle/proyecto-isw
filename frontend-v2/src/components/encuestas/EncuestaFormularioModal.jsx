import ConfirmModal from "../ConfirmModal";
import { useState } from "react";
import {
    Alert,
    Button,
    Form,
    Modal,
    Spinner
} from "react-bootstrap";

import PreguntaEditor from "./PreguntaEditor";

import {
    TIPOS_ENCUESTA,
    nuevaEncuesta,
    nuevaPregunta,
    requiereOpciones
} from "./encuesta.utils";

import {
    createEncuesta,
    updateEncuesta
} from "../../services/encuesta.service";

export default function EncuestaFormularioModal({
                                                    encuesta,
                                                    onClose,
                                                    onSaved
                                                }) {
    const editando = Boolean(encuesta);

    const [form, setForm] = useState(() =>
        encuesta
            ? {
                nombre: encuesta.nombre,
                descripcion: encuesta.descripcion ?? "",
                tipo: encuesta.tipo,
                preguntas: encuesta.preguntas.map((p, indiceOriginal) => ({
                    indiceOriginal,
                    enunciado: p.enunciado,
                    tipo: p.tipo,
                    obligatoria: p.obligatoria,
                    opciones: [...p.opciones]
                }))
            }
            : nuevaEncuesta()
    );

    const [confirmarRetiro, setConfirmarRetiro] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cambiarCampo = (campo, valor) => {
        setForm(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const actualizarPregunta = (index, pregunta) => {
        setForm(prev => ({
            ...prev,
            preguntas: prev.preguntas.map((p, i) =>
                i === index ? pregunta : p
            )
        }));
    };

    const agregarPregunta = () => {
        setForm(prev => ({
            ...prev,
            preguntas: [...prev.preguntas, nuevaPregunta()]
        }));
    };

    const eliminarPregunta = (index) => {
        setForm(prev => ({
            ...prev,
            preguntas: prev.preguntas.filter(
                (_, i) => i !== index
            )
        }));
    };

    const moverPregunta = (index, direccion) => {
        setForm(prev => {
            const preguntas = [...prev.preguntas];
            const destino = index + direccion;

            if (destino < 0 || destino >= preguntas.length) {
                return prev;
            }

            [preguntas[index], preguntas[destino]] =
                [preguntas[destino], preguntas[index]];

            return { ...prev, preguntas };
        });
    };

    const validarFormulario = () => {
        if (form.nombre.trim().length < 3) {
            return "El nombre debe tener al menos 3 caracteres.";
        }

        for (const [index, pregunta] of form.preguntas.entries()) {
            const numero = index + 1;

            if (pregunta.enunciado.trim().length < 3) {
                return `La pregunta ${numero} no es válida.`;
            }

            if (requiereOpciones(pregunta.tipo)) {
                const opciones = pregunta.opciones.map(
                    opcion => opcion.trim().toLowerCase()
                );

                if (
                    opciones.length < 2 ||
                    opciones.some(opcion => !opcion)
                ) {
                    return `Completa las alternativas de la pregunta ${numero}.`;
                }

                if (new Set(opciones).size !== opciones.length) {
                    return `La pregunta ${numero} contiene alternativas duplicadas.`;
                }
            }
        }

        return null;
    };

    const preguntasRetiradas = encuesta?.preguntas.filter((_, indice) =>
        !form.preguntas.some(pregunta => pregunta.indiceOriginal === indice)
    ) ?? [];

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const errorValidacion = validarFormulario();

        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        if (preguntasRetiradas.length) {
            setConfirmarRetiro(true);
            return;
        }
        guardarEncuesta();
    };

    const guardarEncuesta = async () => {
        setGuardando(true);

        try {
            const { tipo, nombre, descripcion, preguntas } = form;
            const contenido = {
                nombre,
                descripcion,
                preguntas: preguntas.map(({ enunciado, tipo, obligatoria, opciones }) => ({
                    enunciado, tipo, obligatoria, opciones
                }))
            };

            if (editando) {
                await updateEncuesta(encuesta.id, contenido);
            } else {
                await createEncuesta({ tipo, ...contenido });
            }

            await onSaved();
            onClose();
        } catch (error) {
            setError(
                error.response?.data?.error?.message ??
                error.response?.data?.message ??
                "No fue posible guardar la encuesta."
            );
        } finally {
            setConfirmarRetiro(false);
            setGuardando(false);
        }
    };

    if (confirmarRetiro) {
        return (
            <ConfirmModal
                show
                onHide={() => setConfirmarRetiro(false)}
                onConfirm={guardarEncuesta}
                title="Quitar preguntas de la encuesta"
                confirmText="Quitar y guardar cambios"
                loading={guardando}
            >
                Al guardar <strong>{encuesta.nombre}</strong>, estas preguntas dejarán de formar parte del formulario.
                <ul className="mb-0">{preguntasRetiradas.map((pregunta, i) => (
                    <li key={pregunta.id ?? i}>{pregunta.enunciado}</li>
                ))}</ul>
            </ConfirmModal>
        );
    }

    return (
        <Modal
            show
            size="lg"
            centered
            scrollable
            onHide={() => {
                if (!guardando) onClose();
            }}
        >
            <Form
                onSubmit={handleSubmit}
                className="d-flex flex-column overflow-hidden"
                style={{ minHeight: 0 }}
            >
                <Modal.Header closeButton={!guardando}>
                    <Modal.Title>
                        {editando ? "Editar encuesta" : "Nueva encuesta"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="overflow-auto">
                    {error && (
                        <Alert variant="danger">
                            {error}
                        </Alert>
                    )}

                    <fieldset disabled={guardando}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre *</Form.Label>
                            <Form.Control
                                required
                                minLength={3}
                                maxLength={100}
                                value={form.nombre}
                                onChange={(e) =>
                                    cambiarCampo("nombre", e.target.value)
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                maxLength={1000}
                                value={form.descripcion}
                                onChange={(e) =>
                                    cambiarCampo("descripcion", e.target.value)
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Tipo de encuesta</Form.Label>
                            <Form.Select
                                value={form.tipo}
                                disabled={editando}
                                onChange={(e) =>
                                    cambiarCampo("tipo", e.target.value)
                                }
                            >
                                {Object.entries(TIPOS_ENCUESTA).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </Form.Select>
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold mb-0">
                                Preguntas
                            </h5>

                            <small className="text-secondary">
                                {form.preguntas.length} / 30
                            </small>
                        </div>

                        {form.preguntas.map((pregunta, index) => (
                            <PreguntaEditor
                                key={index}
                                pregunta={pregunta}
                                index={index}
                                total={form.preguntas.length}
                                onChange={(data) =>
                                    actualizarPregunta(index, data)
                                }
                                onRemove={() => eliminarPregunta(index)}
                                onMove={(direccion) =>
                                    moverPregunta(index, direccion)
                                }
                            />
                        ))}

                        <Button
                            className="w-100"
                            variant="outline-primary"
                            disabled={form.preguntas.length >= 30}
                            onClick={agregarPregunta}
                        >
                            <i className="bi bi-plus-lg me-2" />
                            Agregar pregunta
                        </Button>
                    </fieldset>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        disabled={guardando}
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>

                    <Button type="submit" disabled={guardando}>
                        {guardando && (
                            <Spinner size="sm" className="me-2" />
                        )}

                        {editando ? "Guardar cambios" : "Crear encuesta"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}