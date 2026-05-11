import type { Locale } from "../../i18n/types"
import type { LocalizedText, ProductionPayload } from "../../types/production"

type ArchiveContentTabProps = {
    production: ProductionPayload
    editLanguage: Locale
    basicFields: (keyof ProductionPayload)[]
    descriptionFields: (keyof ProductionPayload)[]
    contentLabels: Record<string, string>

    onChange: (field: keyof ProductionPayload, lang: Locale, value: string) => void
}

function ArchiveTabContent({
    production,
    editLanguage,
    basicFields,
    descriptionFields,
    contentLabels,
    onChange
} : ArchiveContentTabProps) {
    return (
        <div className="px-8 py-6 flex flex-col">
            {basicFields.map((field) => ( 
                <div key={field}>
                    <p className="mb-4 text-sm font-bold tracking-wide">{contentLabels[field]}</p>
                    <div className="mb-8 flex h-12 items-center rounded-xl border border-border bg-surface px-4">
                        <input
                            type="text"
                            value={(production[field] as LocalizedText)?.[editLanguage] ?? ""}
                            onChange={e => onChange(field, editLanguage, e.target.value)}
                            placeholder="type here ..."
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                        />
                    </div>
                </div>
            ))}
            {descriptionFields.map((field) => (
                <div key={field}>
                    <p className="mb-4 text-sm font-bold tracking-wide">{contentLabels[field]}</p>
                    <div className="mb-8 rounded-xl border border-border bg-surface px-4 py-3">
                        <textarea
                            value={(production[field] as LocalizedText)?.[editLanguage] ?? ""}
                            onChange={e => onChange(field, editLanguage, e.target.value)}
                            placeholder="type here ..."
                            rows={6}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none "
                        />
                    </div>

                </div>
            ))}
        </div>
    )
}

export default ArchiveTabContent
