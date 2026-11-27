import { Outlet } from "react-router-dom";

import PublicFooter from "../components/PublicFooter";

export default function PublicLayout() {
    return (
        <div
            className="d-flex flex-column"
            style={{
                minHeight: "calc(100dvh - var(--navbar-height, 60px))"
            }}
        >
            <div className="flex-grow-1">
                <Outlet />
            </div>

            <PublicFooter />
        </div>
    );
}