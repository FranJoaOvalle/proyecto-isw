import { useId } from "react";
import { Button, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";

import "./ActionButton.css";

export default function ActionButton({ icon, label, disabled = false, loading = false, ...props }) {
    const tooltipId = useId();
    const inactive = disabled || loading;
    const button = (
        <Button
            {...props}
            size="sm"
            className="action-button"
            aria-label={label}
            aria-busy={loading || undefined}
            disabled={inactive}
        >
            {loading
                ? <Spinner size="sm" aria-hidden="true" />
                : <i className={`bi ${icon}`} aria-hidden="true" />}
        </Button>
    );

    return (
        <OverlayTrigger
            placement="top"
            flip
            trigger={["hover", "focus"]}
            overlay={<Tooltip id={tooltipId}>{label}</Tooltip>}
        >
            {inactive ? (
                <span className="action-button-disabled" tabIndex={0} role="group" aria-disabled="true" aria-label={label}>
                    {button}
                </span>
            ) : button}
        </OverlayTrigger>
    );
}
