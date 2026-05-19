import QuillEditor from "./blogs/QuillEditor"
import type { Locale } from "../../i18n/types"
import type { LocalizedText, ProductionPayload } from "../../types/production"

type ArchiveContentTabProps = {
    production: ProductionPayload
    editLanguage: Locale
    basicFields: (keyof ProductionPayload)[]
    descriptionFields: (keyof ProductionPayload)[]
    contentLabels: Record<string, string>

    onChange: (field: keyof ProductionPayload, lang: Locale, value: string) => void
    onDescriptionJsonChange?: (field: keyof ProductionPayload, lang: Locale, value: unknown) => void
}

function ArchiveTabContent({
    production,
    editLanguage,
    basicFields,
    descriptionFields,
    contentLabels,
    onChange,
    onDescriptionJsonChange,
} : ArchiveContentTabProps) {
    return (
        <div className="px-8 py-6 flex flex-col gap-4">
            {basicFields.map((field) => ( 
                <div key={field}>
                    <p className="mb-4 text-sm font-bold tracking-wide">{contentLabels[field]}</p>
                    <div className="flex h-12 items-center rounded-xl border border-border bg-surface px-4">
                        <input
                            type="text"
                            value={(production[field] as LocalizedText)?.[editLanguage] ?? ""}
                            onChange={e => {
                                onChange(field, editLanguage, e.target.value)
                            }
                                }
                            placeholder="type here ..."
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                        />
                    </div>
                </div>
            ))}
            {descriptionFields.map((field) => (
                <div key={field}>
                    <p className="mb-4 text-sm font-bold tracking-wide">{contentLabels[field]}</p>
                    <QuillEditor
                        value={(production[field] as LocalizedText)?.[editLanguage] ?? ""}
                        onChange={value => {
                            onChange(field, editLanguage, value)
                        }}
                        onJsonChange={onDescriptionJsonChange
                            ? value => onDescriptionJsonChange(field, editLanguage, value)
                            : undefined}
                        showImages={false}
                    />
                </div>
            ))}
        </div>
    )
}

export default ArchiveTabContent
