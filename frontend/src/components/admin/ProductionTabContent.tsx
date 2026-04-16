import type { ProductionContent, ProductionFields } from "../../types/production"
import SlugInput from "./SlugInput"

type ProductionContentTabProps = {
    fields: ProductionFields
    titleLabel: string
    contentLabel: string
    slugLabel: string

    title: string
    slug: string
    content: string
    currentTab: ProductionContent
    changeLanguage: (field: keyof ProductionFields, value: string) => void
    changeTitle: (value: string) => void
    changeSlug: (value: string) => void
    changeContent: (value: string) => void
}

function ProductionContentTab({
    fields, 
    titleLabel, 
    slugLabel, 
    contentLabel,
    title,
    slug,
    content,
    currentTab,
    changeLanguage, 
    changeSlug,
    changeTitle,
    changeContent
} : ProductionContentTabProps) {
    return (
        <section className="relative px-4 py-4 overflow-hidden">
            <div className="px-4 py-4 relative flex flex-col">
                <form
                    // onSubmit={}
                    className="w-full max-w-xl rounded-xl p-2 md:max-w-none"
                >
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {titleLabel}
                    </p>
                    <div className="mb-8 rounded-xl border border-border bg-background">
                        <div className="bg-surface rounded-xl flex h-12 px-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(value) => changeTitle(value.target.value)}
                                // placeholder={}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {slugLabel}
                    </p>
                    <SlugInput
                        slug={slug}
                        onChange={changeSlug}
                    />
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {contentLabel}
                    </p>

                    {/* TODO: use a other tool for writing content*/}
                    <div className=" rounded-xl border border-border bg-background">
                        <div className="bg-surface rounded-xl flex h-12 px-4">
                            <input
                                type="text"
                                value={content}
                                onChange={(value) => changeContent(value.target.value)}
                                placeholder="change to plugin"
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default ProductionContentTab