import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { api } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale, withLocalePath } from '../../i18n'

type BlogDetails = {
    id: string
    title?: string | null
    content?: unknown
}

type BlogDetailResponse = {
    data: BlogDetails
}

type QuillDelta = {
    ops: Array<Record<string, unknown>>
}

function normalizeContent(content: unknown): QuillDelta | null {
    if (!content) {
        return null
    }

    if (typeof content === 'string') {
        try {
            return normalizeContent(JSON.parse(content) as unknown)
        } catch {
            return null
        }
    }

    if (typeof content === 'object' && content !== null && 'ops' in content) {
        return content as QuillDelta
    }

    return null
}

function QuillReadOnly({ content }: { content: unknown }) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const delta = useMemo(() => normalizeContent(content), [content])

    useEffect(() => {
        if (!containerRef.current) {
            return
        }

        const quill = new Quill(containerRef.current, {
            theme: 'snow',
            readOnly: true,
            modules: { toolbar: false },
        })

        if (delta) {
            quill.setContents(delta as any)
        } else {
            quill.setText('')
        }

        return () => {
            containerRef.current?.replaceChildren()
        }
    }, [delta])

    return <div ref={containerRef} className="overflow-hidden rounded-xl border border-border bg-surface" />
}

function BlogDetailPage() {
    const { id } = useParams<{ id: string }>()
    const locale = getActiveLocale(window.location.pathname)
    const [blog, setBlog] = useState<BlogDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        const loadBlog = async () => {
            if (!id) {
                setError('Blog not found.')
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError('')

            try {
                const response = await api.get<BlogDetailResponse>(`/archive/blogs/${id}`)

                if (isActive) {
                    setBlog(response.data)
                }
            } catch (loadError) {
                if (isActive) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load blog.')
                }
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        void loadBlog()

        return () => {
            isActive = false
        }
    }, [id])

    return (
        <PublicLayout>
            <section className="site-container py-12">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link
                        to={withLocalePath('/blogs', locale)}
                        className="text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                    >
                        ← Back to blogs
                    </Link>
                </div>

                {isLoading ? <p className="text-center text-muted">Loading blog...</p> : null}
                {error ? <p className="text-center text-red-500">{error}</p> : null}

                {!isLoading && !error && blog ? (
                    <article className="mx-auto max-w-4xl">
                        <h1 className="mb-6 text-4xl font-semibold text-foreground">{blog.title?.trim() || 'Untitled blog'}</h1>
                        <QuillReadOnly content={blog.content} />
                    </article>
                ) : null}
            </section>
        </PublicLayout>
    )
}

export default BlogDetailPage