import type { Language } from '../../types/blog'

type BlogsTabProps = {
    language: Language
    options: { key: Language; label: string }[]
    setTab: (key: Language) => void
}

function BlogsTab({ options, language, setTab }: BlogsTabProps) {
    return (
        <div className="px-4 flex border-b border-border">
            {options.map(({ key, label }) => (
                <button
                    className={[
                        'relative px-4 py-4 pb-8 text-sm font-bold tracking-wide transition-colors',
                        language === key ? 'text-accent' : 'text-muted hover:text-foreground',
                    ].join(' ')}
                    key={key}
                    onClick={() => {
                        setTab(key)
                    }}
                >
                    {label}

                    {language === key && <span className="absolute bottom-0 left-0 w-full h-1 bg-accent" />}
                </button>
            ))}
        </div>
    )
}
export default BlogsTab
