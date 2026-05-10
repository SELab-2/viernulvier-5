import type { Locale } from "../../i18n/types"

type ProductionTabProps = {
    language: Locale
    options: { key: Locale, label: string}[]
    setTab: (key: Locale) => void
}

function ProductionTab({options, language, setTab}: ProductionTabProps) {
    return (
        <div className="px-4 flex border-b border-border">
            {options.map(({ key, label }) => (
                <button 
                className={[
                    "relative px-4 py-4 pb-8 text-sm font-bold tracking-wide transition-colors",
                    language === key ? "text-accent" : "text-muted hover:text-foreground"
                ].join(' ')}
                key={key} onClick={() => setTab(key)}>
                
                {label}

                {language === key && 
                    (<span className="absolute bottom-0 left-0 w-full h-1 bg-accent"/>)
                }
                </button>
            ))}
        </div>
    )
}
export default ProductionTab