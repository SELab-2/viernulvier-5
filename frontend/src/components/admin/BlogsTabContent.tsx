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
                    <div className="admin-detail-input mb-8">
                        <input
                            type="text"
                            value={title}
                            onChange={(value) => changeTitle(value.target.value)}
                            aria-label={titleLabel}
                            className="admin-detail-field text-sm leading-6"
                        />
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
