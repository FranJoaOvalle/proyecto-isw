import { useRef } from "react";
import {
    Button,
    Modal,
    Spinner
} from "react-bootstrap";

export default function ConfirmModal({
                                         show,
                                         onHide,
                                         onConfirm,
                                         title,
                                         children,
                                         confirmText = "Confirmar",
                                         variant = "danger",
                                         loading = false,
                                         confirmDisabled = false
                                     }) {
    const confirmando = useRef(false);

    async function confirmar(event) {
        if (!show || loading || confirmDisabled || confirmando.current) return;
        confirmando.current = true;
        try {
            await onConfirm(event);
        } finally {
            confirmando.current = false;
        }
    }

    return (
        <Modal
            show={show}
            onHide={loading ? undefined : onHide}
            centered
            backdrop={loading ? "static" : true}
            keyboard={!loading}
        >
            <Modal.Header closeButton={!loading}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {children}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={loading}
                >
                    Cancelar
                </Button>

                <Button
                    variant={variant}
                    onClick={confirmar}
                    disabled={!show || loading || confirmDisabled}
                >
                    {loading && (
                        <Spinner
                            size="sm"
                            className="me-2"
                        />
                    )}
                    
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
