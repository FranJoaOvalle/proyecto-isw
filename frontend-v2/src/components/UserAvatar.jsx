import { useLayoutEffect, useRef, useState } from "react";

import "./UserAvatar.css";

const AVATAR_COLORS = [
    "#F43F5E",
    "#E11D48",
    "#DB2777",
    "#C026D3",
    "#D946EF",
    "#9333EA",
    "#7C3AED",
    "#8B5CF6",
    "#6366F1",
    "#4F46E5",
    "#2563EB",
    "#3B82F6",
    "#0284C7",
    "#0891B2",
    "#0D9488",
    "#14B8A6",
    "#059669",
    "#16A34A",
    "#65A30D",
    "#84CC16",
    "#EAB308",
    "#D97706",
    "#F59E0B",
    "#EA580C",
    "#F97316",
    "#EF4444",
    "#DC2626",
    "#E76F51",
    "#B45309",
    "#9B5C43",
    "#64748B",
    "#475569"
];

const getInitials = (nombre, firstName, lastName) => {
    const partes = [firstName, lastName]
        .filter(part => Boolean(part?.trim()));

    if (partes.length) {
        return partes
            .map(part => part.trim()[0].toUpperCase())
            .join("")
            .slice(0, 2);
    }

    const palabras = String(nombre ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!palabras.length) return "?";

    if (palabras.length === 1)
        return palabras[0].slice(0, 2).toUpperCase();

    return (
        palabras[0][0] +
        palabras[palabras.length - 1][0]
    ).toUpperCase();
};

const getAvatarColor = (value) => {
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFC");

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = Math.imul(31, hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return AVATAR_COLORS[
    (hash >>> 0) % AVATAR_COLORS.length
        ];
};

export default function UserAvatar({
                                       nombre,
                                       firstName,
                                       lastName,
                                       userId,
                                       color,
                                       size = 36,
                                       className = ""
                                   }) {
    const initials = getInitials(nombre, firstName, lastName);

    const nombreCompleto = nombre ||
        [firstName, lastName].filter(Boolean).join(" ");

    const background = color ??
        getAvatarColor(userId ?? nombreCompleto);

    const textRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        let active = true;

        const centerText = () => {
            const text = textRef.current;

            if (!text || !active) return;

            const bounds = text.getBBox();

            const x = size / 2 - (
                bounds.x + bounds.width / 2
            );

            const y = size / 2 - (
                bounds.y + bounds.height / 2
            );

            setOffset(current =>
                current.x === x && current.y === y
                    ? current
                    : { x, y }
            );
        };

        centerText();

        if (document.fonts) {
            void document.fonts.ready.then(centerText);
        }

        return () => {
            active = false;
        };
    }, [initials, size]);

    return (
        <span
            className={`user-avatar ${className}`.trim()}
            aria-hidden="true"
            title={nombreCompleto || undefined}
            style={{
                width: size,
                height: size,
                backgroundColor: background
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ display: "block" }}
            >
                <text
                    ref={textRef}
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="currentColor"
                    transform={`translate(${offset.x} ${offset.y})`}
                    style={{
                        fontFamily: "var(--bs-body-font-family)",
                        fontSize: size * 0.34,
                        fontWeight: 700
                    }}
                >
                    {initials || "?"}
                </text>
            </svg>
        </span>
    );
}