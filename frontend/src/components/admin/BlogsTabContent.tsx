import QuillEditor from './blogs/QuillEditor'

type BlogsTabContentProps = {
    titleLabel: string
    contentLabel: string

    title: string
    content: string
    onJsonChange: (value: unknown) => void
    changeTitle: (value: string) => void
    changeContent: (value: string) => void
}

function BlogsTabContent({
    titleLabel,
    contentLabel,
    title,
    content,
    changeTitle,
    changeContent,
    onJsonChange,
}: BlogsTabContentProps) {
    return (
        <section className="relative px-4 py-4 overflow-hidden">
            <div className="px-4 py-4 relative flex flex-col">
                <form className="w-full max-w-xl rounded-xl p-2 md:max-w-none">
                    <p className="mb-4 text-sm font-bold tracking-wide">{titleLabel}</p>
                    <div className="mb-8 rounded-xl border border-border bg-background">
                        <div className="bg-surface rounded-xl flex h-12 px-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(value) => changeTitle(value.target.value)}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>

                    <p className="mb-4 text-sm font-bold tracking-wide">{contentLabel}</p>

                    <QuillEditor
                        value={content}
                        onChange={changeContent}
                        onJsonChange={onJsonChange}
                        placeholder="Schrijf je blog content hier..."
                    />
                </form>
            </div>
        </section>
    )
}

export default BlogsTabContent
