type ProductionEditHeaderProps = {
    back: () => void
    saveAsDraft: () => void
    publish: () => void
    backLabel: string
    saveAsDraftLabel: string
    publishLabel: string
}

function ProductionEditHeader({backLabel, saveAsDraftLabel, publishLabel, back, saveAsDraft, publish}: ProductionEditHeaderProps) {
    return (
        <header className="flex items-center gap-3 border border-border bg-surface px-6 py-4">
            <button onClick={back}>
                <p className="text-sm font-regular tracking-wide text-accent">
                    {backLabel}
                </p>
            </button>

            <span className="flex-1"/>

            <button onClick={saveAsDraft}>
                <p className="text-sm font-regular tracking-wide text-accent border py-2 px-4 rounded-full">
                    {saveAsDraftLabel}
                </p>
            </button>
            <button onClick={publish}>
                <p className="text-sm text-white font-regular tracking-wide text-accent bg-accent py-2 px-4 rounded-full">
                    {publishLabel}
                </p>
            </button>
        </header>
    )
}

export default ProductionEditHeader