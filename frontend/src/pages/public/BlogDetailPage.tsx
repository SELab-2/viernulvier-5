import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { api } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale, withLocalePath } from '../../i18n'
import ProductionCard from '../../components/blogs/ProductionCard'
import {
    getLocalizedContent,
    getLocalizedTitle,
    hasLocalizedTitle,
    normalizeContent,
    type BlogDetailResponse,
    type BlogDetails,
    type BlogLinkedProduction,
    type ProductionDetailResponse,
} from './blogDetailPage.formatters'
import { getMessages } from '../../i18n'

/*
This page shows the content of a blog in both english and dutch (/en or /nl). You can also click on the productions that are related to this blog
*/

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
            quill.setContents(delta as Parameters<Quill['setContents']>[0])
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
    const message = getMessages(locale)
    const [blog, setBlog] = useState<BlogDetails | null>(null)
    const [productions, setProductions] = useState<BlogLinkedProduction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
    const [error, setError] = useState('')

    // load productions or catch not existing production
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
                    
                    // check blog in this lanuage exists
                    const titleExists = hasLocalizedTitle(response.data.title, locale)

                    if (!titleExists){
                        setError(message.blogs.languageError)
                        return
                    }
                                    
                    // load all productions
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
    }, [id, locale, message.blogs.languageError])

    return (
        <PublicLayout>
            <section className="site-container py-12">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link
                        to={withLocalePath('/', locale)}
                        className="text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                    >
                        {message.blogs.detailPageBack}
                    </Link>
                </div>

                {isLoading ? <p className="text-center text-muted">{message.blogs.loadingBlog}</p> : null}
                {error ? <p className="text-center text-red-500">{error}</p> : null}

                {!isLoading && !error && blog ? (
                    <article className="mx-auto max-w-4xl">
                        <h1 className="mb-6 text-4xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">
                            {getLocalizedTitle(blog.title, locale) || message.blogs.untitledBlog}
                        </h1>
                        <QuillReadOnly content={getLocalizedContent(blog.content, locale)} />

                        {isLoadingProductions || productions.length > 0 ? (
                            <section className="mt-10">
                                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                                    {message.blogs.relatedProductions}
                                </h2>

                                {isLoadingProductions ? <p className="text-sm text-muted">{message.blogs.loadingProductions}</p> : null}

                                {!isLoadingProductions && productions.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {productions.map((production) => (
                                            <ProductionCard
                                                key={production.id}
                                                production={production}
                                                locale={locale}
                                                href={withLocalePath(`/productions/${production.id}`, locale)}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </section>
        </PublicLayout>
    )
}

export default BlogDetailPage