type TagInputProps = {
    tags: string[]
    tag: string
    addTag: () => void
    onRemove: (tag: string) => void
    onChange: (key: string) => void
}

function TagInput({
    tags,
    tag,
    addTag,
    onRemove,
    onChange
}: TagInputProps) {

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full bg-accent/25 border-accent border px-3 py-1 text-xs font-bold text-foreground"
                    >
                        {tag}
                        <button type='button' onClick={() => onRemove(tag)} className="hover:opacity-70">
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <div className="border border-border mb-8 gap-2 w-9/10 flex h-12 items-center rounded-md bg-background px-4 text-muted">
                <input
                    type="text"
                    value={tag}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                        }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                />
                <button
                    type="button"
                    onClick={addTag}
                    className="text-xs font-bold text-accent hover:opacity-70"
                >
                    +
                </button>
            </div>
        </div>
    )
}

export default TagInput