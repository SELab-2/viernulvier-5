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

type QuillSetContentsArg = Parameters<Quill['setContents']>[0]

type LocalizedBlogContent = {
    nl?: unknown
    en?: unknown
}

type LocalizedBlogTitle = {
    nl?: string | null
    en?: string | null
}

function parsePossibleJson(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }

    try {
        return JSON.parse(value) as unknown
    } catch {
        return value
    }
}

function getLocalizedContent(content: unknown, locale: 'nl' | 'en'): unknown {
    const parsed = parsePossibleJson(content)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogContent
        return localized[locale] ?? localized.nl ?? localized.en ?? null
    }

    return parsed
}

function getLocalizedTitle(title: unknown, locale: 'nl' | 'en'): string {
    const parsed = parsePossibleJson(title)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogTitle
        return (localized[locale] ?? localized.nl ?? localized.en ?? '').trim()
    }

    if (typeof parsed === 'string') {
        return parsed.trim()
    }

    return ''
}

function normalizeContent(content: unknown): QuillDelta | null {
    if (!content) {
        return null
    }

    const parsed = parsePossibleJson(content)

    if (typeof parsed === 'object' && parsed !== null && 'ops' in parsed) {
        return parsed as QuillDelta
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

        const container = containerRef.current

        const quill = new Quill(container, {
            theme: 'snow',
            readOnly: true,
            modules: { toolbar: false },
        })

        if (delta) {
            quill.setContents(delta as QuillSetContentsArg)
        } else {
            quill.setText('')
        }

        return () => {
            container.replaceChildren()
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
                        <h1 className="mb-6 text-4xl font-semibold text-foreground">{getLocalizedTitle(blog.title, locale) || 'Untitled blog'}</h1>
                        <QuillReadOnly content={getLocalizedContent(blog.content, locale)} />
                    </article>
                ) : null}
            </section>
        </PublicLayout>
    )
}

export default BlogDetailPage