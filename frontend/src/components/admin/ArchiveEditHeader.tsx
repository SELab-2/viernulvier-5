type ArchiveEditHeaderProps = {
    publish: (asDraft?: boolean) => void
    saveAsDraftLabel: string // Extra draft feature
    publishLabel: string
}

function ArchiveEditHeader({
    publish,

    saveAsDraftLabel, // Extra draft feature
    publishLabel, 
}: ArchiveEditHeaderProps) {
    return (
        <header className="flex items-center gap-3 border border-border bg-surface px-6 py-4">
            <span className="flex-1"/>

            {/* Extra feature draft, might add this back later*/}
            <button onClick={() => publish(true)}>
                <p className="text-sm font-regular tracking-wide text-accent border py-2 px-4 rounded-full">
                    {saveAsDraftLabel}
                </p>
            </button>
            <button onClick={() => publish()}>
                <p className="text-sm text-white font-regular tracking-wide text-accent bg-accent py-2 px-4 rounded-full">
                    {publishLabel}
                </p>
            </button>
        </header>
    )
}

export default ArchiveEditHeader
