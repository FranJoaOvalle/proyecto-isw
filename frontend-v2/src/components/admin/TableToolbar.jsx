import { Form, InputGroup } from "react-bootstrap";

export default function TableToolbar({
                                         search,
                                         onSearchChange,
                                         searchPlaceholder = "Buscar...",
                                         estado,
                                         onEstadoChange,
                                         children,
                                         opcionesEstado = { TODOS: "Todos", ACTIVOS: "Activos", INACTIVOS: "Inactivos" }
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
                {Object.entries(opcionesEstado).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Form.Select>

            {children}
        </div>
    );
}
