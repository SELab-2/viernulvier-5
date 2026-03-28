type ProductionEditHeaderProps = {
    backText: string
    saveAsDraftText: string
    publishText: string
    back: () => void
    saveAsDraft: () => void
    publish: () => void
}

function ProductionEditHeader({backText, saveAsDraftText, publishText, back, saveAsDraft, publish}: ProductionEditHeaderProps) {
    return (
        <header className="flex items-center gap-3 border border-border bg-surface px-6 py-4">
            <button onClick={back}>
                <p className="text-sm font-regular tracking-wide text-accent">
                    {backText}
                </p>
            </button>

            <span className="flex-1"/>

            <button onClick={saveAsDraft}>
                <p className="text-sm font-regular tracking-wide text-accent border py-2 px-4 rounded-full">
                    {saveAsDraftText}
                </p>
            </button>
            <button onClick={publish}>
                <p className="text-sm text-white font-regular tracking-wide text-accent bg-accent py-2 px-4 rounded-full">
                    {publishText}
                </p>
            </button>
        </header>
    )
}

export default ProductionEditHeader
