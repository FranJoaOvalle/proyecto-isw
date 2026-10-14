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
                                         loading = false
                                     }) {
    return (
        <Modal show={show} onHide={onHide} centered>
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
                    onClick={onConfirm}
                    disabled={loading}
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