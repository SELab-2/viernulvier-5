import type { Language } from "../../types/production"

type ProductionTabProps = {
    language: Language // QUESTION: maybe a separate type for languages in /types/production.tsx?
    options: { key: Language, label: string}[]
    setTab: (key: Language) => void
}

function ProductionTab({options, language, setTab}: ProductionTabProps) {

    return (
        <div className="px-4 flex border-b border-border">
            {options.map(({ key, label }) => (
                <button 
                className={[
                    "relative px-4 py-4 pb-8 text-sm font-bold tracking-wide transition-colors",
                    language === key ? "text-accent" : "text-muted hover:text-foreground"
                ].join(' ')} // HACK: weird way to do this, maybe there is a better way?
                key={key} onClick={() =>{
                    setTab(key)
                    console.log(key)
                    } }>
                
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