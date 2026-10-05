import { Container } from "react-bootstrap";

export default function ModulePlaceholder({title, description}) {
    return (
        <Container className="py-5">
            <h1 className="fw-bold">{title}</h1>
            <p className="text-secondary mb-0">{description}</p>
        </Container>
    );
};