import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { api } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale, withLocalePath } from '../../i18n'
import {
    getLocalizedContent,
    getLocalizedTitle,
    getProductionDate,
    getProductionExcerpt,
    getProductionLabel,
    getProductionVenue,
    normalizeContent,
    type BlogDetailResponse,
    type BlogDetails,
    type BlogLinkedProduction,
    type ProductionDetailResponse,
} from './blogDetailPage.formatters'

type QuillSetContentsArg = Parameters<Quill['setContents']>[0]

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
    const [productions, setProductions] = useState<BlogLinkedProduction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
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

                    const linkedProductionIds = response.data.productions ?? []
                    if (linkedProductionIds.length === 0) {
                        setProductions([])
                        return
                    }

                    setIsLoadingProductions(true)

                    const linkedProductionResponses = await Promise.all(
                        linkedProductionIds.map((productionId) => api.get<ProductionDetailResponse>(`/archive/productions/${productionId}`)),
                    )

                    if (isActive) {
                        setProductions(linkedProductionResponses.map((entry) => entry.data))
                    }
                }
            } catch (loadError) {
                if (isActive) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load blog.')
                }
            } finally {
                if (isActive) {
                    setIsLoading(false)
                    setIsLoadingProductions(false)
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

                        <section className="mt-10">
                            <h2 className="mb-4 text-2xl font-semibold text-foreground">
                                {locale === 'nl' ? 'Gerelateerde producties' : 'Related productions'}
                            </h2>

                            {isLoadingProductions ? <p className="text-sm text-muted">{locale === 'nl' ? 'Producties laden...' : 'Loading productions...'}</p> : null}

                            {!isLoadingProductions && productions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {productions.map((production) => (
                                        <Link
                                            key={production.id}
                                            to={withLocalePath(`/productions/${production.id}`, locale)}
                                            className="rounded-xl border border-border bg-background transition hover:border-[var(--color-accent)]/60"
                                        >
                                            <article className="flex w-full flex-col p-3">
                                                <div className="relative h-24 overflow-hidden rounded-md bg-gradient-to-br from-accent to-accent/50">
                                                    {production.image_url ? (
                                                        <img
                                                            src={production.image_url}
                                                            alt={getProductionLabel(production, locale)}
                                                            className="absolute inset-0 h-full w-full object-cover"
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : null}
                                                    <div className="absolute inset-0 bg-black/20" />
                                                </div>

                                                <p className="mt-2 text-xs text-text-accent">{getProductionDate(production, locale)}</p>
                                                <h3 className="mt-1 line-clamp-2 text-lg leading-tight text-foreground [overflow-wrap:anywhere]">
                                                    {getProductionLabel(production, locale)}
                                                </h3>
                                                <p className="mt-1 line-clamp-2 text-sm text-text-accent">{getProductionExcerpt(production, locale)}</p>
                                                <p className="mt-2 text-xs font-semibold lowercase tracking-wide text-text-accent">
                                                    {getProductionVenue(production)}
                                                </p>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </section>
                    </article>
                ) : null}
            </section>
        </PublicLayout>
    )
}

export default BlogDetailPage