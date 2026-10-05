import { Form, InputGroup } from "react-bootstrap";

export default function TableToolbar({
                                         search,
                                         onSearchChange,
                                         searchPlaceholder = "Buscar...",
                                         estado,
                                         onEstadoChange,
                                         children
                                     }) {
    return (
        <div className="d-flex flex-column flex-lg-row gap-3 mb-4">
            <InputGroup className="flex-grow-1">
                <InputGroup.Text>
                    <i className="bi bi-search" />
                </InputGroup.Text>

                <Form.Control
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                />
            </InputGroup>

            <Form.Select
                value={estado}
                onChange={(e) => onEstadoChange(e.target.value)}
                style={{ maxWidth: 180 }}
            >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
            </Form.Select>

            {children}
        </div>
    );
}