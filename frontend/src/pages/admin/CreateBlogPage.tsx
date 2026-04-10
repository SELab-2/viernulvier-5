import { useState } from 'react'
import PublicLayout from '../../components/public/PublicLayout'
import QuillEditor from '../../components/admin/QuillEditor'
import { api } from '../../api/client'


/**
 * Admin page for editing an archive item.
 */
function CreateBlogPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [contentJson, setContentJson] = useState<unknown | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSave = async () => {
        const trimmedTitle = title.trim()

        if (!trimmedTitle) {
            setError('Please add a title before saving.')
            setSuccess('')
            return
        }

        setIsSaving(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.post<{ data: { id: string } }>('/archive/blogs', {
                title: trimmedTitle,
                content: contentJson ?? null,
                productionIds: [],
            })

            setSuccess(`Blog saved successfully. ID: ${response.data.id}`)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save blog.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <PublicLayout>
            <section className="site-container py-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Create Blog</h1>
                <p className="mb-6 text-sm text-muted">Write a title and content, then save the blog to the database.</p>

                <div className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="blog-title">
                        Title
                    </label>
                    <input
                        id="blog-title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Enter blog title"
                        className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-foreground outline-none transition focus:border-[var(--color-accent)]"
                    />
                </div>

                <QuillEditor
                    value={content}
                    onChange={setContent}
                    onJsonChange={setContentJson}
                    placeholder="Write your blog content here..."
                />

                <div className="mt-6 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-lg bg-[var(--color-accent)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? 'Saving...' : 'Save blog'}
                    </button>

                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    {success ? <p className="text-sm text-green-600">{success}</p> : null}
                </div>
            </section>
        </PublicLayout>
    )
}

export default CreateBlogPage