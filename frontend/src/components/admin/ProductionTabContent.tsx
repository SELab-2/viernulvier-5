import type { ProductionContent, ProductionFields } from "../../types/production"
import SlugInput from "./SlugInput"

type ProductionContentTabProps = {
    fields: ProductionFields
    titleLabel: string
    contentLabel: string
    slugLabel: string

    // currentTab: ProductionContent
    // changeLanguage: (field: keyof ProductionFields, value: string) => void
    onChange: (field: keyof ProductionFields, value: string) => void
}

function ProductionContentTab({
    fields, 
    titleLabel, 
    slugLabel, 
    contentLabel,
    onChange
} : ProductionContentTabProps) {
    return (
        <div className="px-8 py-6 flex flex-col">
            <p className="mb-4 text-sm font-bold tracking-wide">{titleLabel}</p>
            <div className="mb-8 flex h-12 items-center rounded-xl border border-border bg-surface px-4">
                <input
                    type="text"
                    value={fields.title}
                    onChange={e => onChange('title', e.target.value)}
                    placeholder="Production title"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                />
            </div>

            <p className="mb-4 text-sm font-bold tracking-wide">{slugLabel}</p>
            <SlugInput 
                slug={fields.slug} 
                onChange={onChange} 
            />

            <p className="mb-4 text-sm font-bold tracking-wide">{contentLabel}</p>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <textarea
                    value={fields.content}
                    onChange={e => onChange('content', e.target.value)}
                    placeholder="Production content..."
                    rows={6}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none "
                />
            </div>
        </div>
    )
}

export default ProductionContentTab