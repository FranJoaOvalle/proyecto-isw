export default function EmptyState({icon = "bi-inbox", title, description}) {
    return (
        <div className="text-center py-5">
            <i className={`bi ${icon} fs-1 text-secondary`} />
            
            <h2 className="fs-5 fw-bold mt-3">
                {title}
            </h2>

            <p className="text-secondary mb-0">
                {description}
            </p>
        </div>
    );
}