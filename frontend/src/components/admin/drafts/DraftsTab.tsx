import {useAdminMessages} from "../AdminMessagesContext.tsx";

type TabKey = 'productions' | 'blogs'

type DraftsTabProps = {
    tab: TabKey
    setTab: (key: TabKey) => void
}

function DraftsTab({ tab, setTab }: DraftsTabProps) {
    const messages = useAdminMessages()

    const options: { key: TabKey; label: string }[] = [
        { key: 'productions', label: messages.admin.drafts.productions },
        { key: 'blogs', label: messages.admin.drafts.blogs },
    ]

    return (
        <div className="px-4 flex border-b border-border">
            {options.map(({ key, label }) => (
                <button
                    className={[
                        'relative px-4 py-4 pb-8 text-sm font-bold tracking-wide transition-colors',
                        tab === key ? 'text-accent' : 'text-muted hover:text-foreground',
                    ].join(' ')}
                    key={key}
                    onClick={() => setTab(key)}
                >
                    {label}
                    {tab === key && <span className="absolute bottom-0 left-0 w-full h-1 bg-accent" />}
                </button>
            ))}
        </div>
    )
}

export default DraftsTab