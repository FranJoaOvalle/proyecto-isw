export default function PageHeader({title, description, children}) {
    return (
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
            <div>
                <h1 className="fw-bold mb-2">{title}</h1>
                <p className="text-secondary mb-0">
                    {description}
                </p>
            </div>
            
            {children && (
                <div className="align-self-md-end">
                    {children}
                </div>
            )}
        </div>
    );
}