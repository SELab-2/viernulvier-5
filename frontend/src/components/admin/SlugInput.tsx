import type { ProductionContentFields } from "../../types/production"

type SlugInputProps = {
    slug?: string
    onChange: (field: keyof ProductionContentFields, value: string) => void
}

function SlugInput({slug, onChange}: SlugInputProps) {

    // get the domain of the slug
    const baseURL = window.location.host

    return (
        <div className="border borderborder flex h-12 mb-8 rounded-xl border-r border-border bg-background">
            <div className="px-4 flex rounded-l-xl items-center border-r border-border">
                <span className="text-sm text-muted/75 whitespace-nowrap">{baseURL}/</span>
            </div>
            <input
                type="text"
                value={slug}
                onChange={ (value) => onChange('slug' ,value.target.value)}
                placeholder="url-slug"
                className="px-4 rounded-r-xl w-full bg-surface text-sm font-bold text-foreground placeholder:text-muted outline-none"
            />
        </div>
    )
}
export default SlugInput