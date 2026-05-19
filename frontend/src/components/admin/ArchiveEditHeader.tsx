type ArchiveEditHeaderProps = {
    publish: (asDraft?: boolean) => void
    saveAsDraft?: () => void
    saveAsDraftLabel: string
    publishLabel: string
    saving?: boolean
    saveAction?: 'publish' | 'draft' | null
}

function ArchiveEditHeader({
                               publish,
                               saveAsDraft,
                               saveAsDraftLabel,
                               publishLabel,
                               saving = false,
                               saveAction = null,
                           }: ArchiveEditHeaderProps) {
    return (
        <header className="flex items-center gap-3 border border-border bg-surface px-6 py-4">
            <span className="flex-1"/>

            <button
                onClick={() => (saveAsDraft ? saveAsDraft() : publish(true))}
                disabled={saving}
                className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <p className="text-sm font-regular tracking-wide text-accent border py-2 px-4 rounded-full">
                    {saving && saveAction === 'draft' ? '...' : saveAsDraftLabel}
                </p>
            </button>

            <button
                onClick={() => publish()}
                disabled={saving}
                className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <p className="text-sm text-white font-regular tracking-wide bg-accent py-2 px-4 rounded-full">
                    {saving && saveAction === 'publish' ? '...' : publishLabel}
                </p>
            </button>
        </header>
    )
}

export default ArchiveEditHeader