type ProductionTabProps = {
    language: string // QUESTION: maybe a separate type for languages in /types/production.tsx?
    setTab: (key: string) => void
}

function ProductionTab({language: currentLanguage, setTab}: ProductionTabProps) {
    
    const languages: { key: string, label: string}[] = [
        { key: 'nl', label: 'Nederlands'},
        { key: 'en', label: 'English'},
    ]

    return (
        <div className="flex border-b border-border">
            {languages.map(({ key, label }) => (
                <button 
                className={[
                    "relative px-4 py-3 pb-8 text-sm font-bold tracking-wide transition-colors",
                    currentLanguage === key ? "text-accent" : "text-muted hover:text-foreground"
                ].join(' ')}
                key={key} onClick={() => setTab(key)}
                >
                {label}

                {currentLanguage === key && 
                    (<span className="absolute bottom-0 left-0 w-full h-1 bg-accent"/>)
                }
                </button>
            ))}
        </div>
    )
}
export default ProductionTab
