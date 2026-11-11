import { Toast, ToastContainer } from "react-bootstrap";

export default function NotificacionToast({ mensaje, tipo = "success", onClose }) {
    if (!mensaje) return null;

    const esError = tipo === "danger";
    const esAdvertencia = tipo === "warning";
    const variante = esError ? "danger" : esAdvertencia ? "warning" : "success";
    const titulo = esError ? "Ocurrió un error" : esAdvertencia ? "Revisa las direcciones" : "Listo";
    const icono = esError
        ? "bi-exclamation-circle-fill"
        : esAdvertencia ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill";

    return (
        <ToastContainer position="bottom-end" className="position-fixed p-3" style={{ zIndex: 1080 }}>
            <Toast
                bg={variante}
                onClose={onClose}
                delay={esError ? undefined : 4500}
                autohide={!esError}
                role={esError ? "alert" : "status"}
                aria-live={esError ? "assertive" : "polite"}
            >
                <Toast.Header className={`text-bg-${variante} border-0`}>
                    <i className={`bi ${icono} me-2`} />
                    <strong className="me-auto">{titulo}</strong>
                </Toast.Header>
                <Toast.Body className={esAdvertencia ? "text-dark" : "text-white"}>{mensaje}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
}
