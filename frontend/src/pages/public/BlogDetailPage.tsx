import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { api, ApiError } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { NotFoundContent } from './NotFoundPage'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { LeftArrowIcon } from '../../components/shared/icons'
import PublicPillButton from '../../components/public/PublicPillButton'
import ProductionCard from '../../components/blogs/ProductionCard'
import ArchiveDetailHero from '../../components/public/detail/PublicDetailHeroBanner'
import ArchiveDetailGallery from '../../components/public/detail/PublicDetailGallery'
import '../../styles/QuillEditor.css'
import {
    getLocalizedContent,
    getLocalizedTitle,
    normalizeContent,
    type BlogDetailResponse,
    type BlogDetails,
    type BlogLinkedProduction,
    type ProductionDetailResponse,
} from './blogDetailPage.formatters'
import {useOptionalAdminSession} from "../../auth/useAdminSessionContext.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

    return <div ref={containerRef} className="quill-detail-wrapper overflow-hidden rounded-xl bg-surface" />
}

function BlogDetailPageContent() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const message = usePublicMessages()
    const [blog, setBlog] = useState<BlogDetails | null>(null)
    const [productions, setProductions] = useState<BlogLinkedProduction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
    const [error, setError] = useState('')
    const [notFound, setNotFound] = useState(false)
    const [previousId, setPreviousId] = useState(id)
    const [shareCopied, setShareCopied] = useState(false)

    const session = useOptionalAdminSession()
    const isLoggedIn = Boolean(session?.user)

    if (id !== previousId) {
        setPreviousId(id)
        setError('')
        setNotFound(false)
    }

    const idIsMalformed = typeof id === 'string' && !UUID_REGEX.test(id)

    const handleGoBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1)
        } else {
            navigate(withLocalePath('/', locale))
        }
    }

    const handleShare = async () => {
        const currentUrl = window.location.href

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(currentUrl)
        } else {
            const textArea = document.createElement('textarea')
            textArea.value = currentUrl
            textArea.setAttribute('readonly', '')
            textArea.style.position = 'absolute'
            textArea.style.left = '-9999px'
            document.body.appendChild(textArea)
            textArea.select()
            document.body.removeChild(textArea)
        }

        setShareCopied(true)
        window.setTimeout(() => setShareCopied(false), 1800)
    }

    const shareLabel = message.search.shareLabel
    const shareCopiedLabel = message.search.shareCopiedLabel

    // load productions or catch not existing production
    useEffect(() => {
        let isActive = true

        const loadBlog = async () => {
            if (!id || idIsMalformed) {
                setNotFound(true)
                setIsLoading(false)
                return
            }


            setIsLoading(true)
            setError('')

            let response: BlogDetailResponse
            try {
                response = (await api.get<BlogDetailResponse>(`/archive/blogs/${id}`))
            } catch (loadError) {
                if (!isActive) return
                if (loadError instanceof ApiError && (loadError.status === 404 || loadError.status === 400)) {
                    setNotFound(true)
                } else {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load blog.')
                }
                setIsLoading(false)
                return
            }

            if (response.data.draft && !isLoggedIn) {
                setNotFound(true)
                setIsLoading(false)
                return
            }

            if (!isActive) return
            setBlog(response.data)

            const linkedProductionIds = response.data.productions ?? []
            if (linkedProductionIds.length === 0) {
                setProductions([])
                setIsLoading(false)
                return
            }

            setIsLoadingProductions(true)
            try {
                const linkedProductionResponses = await Promise.all(
                    linkedProductionIds.map((productionId) => api.get<ProductionDetailResponse>(`/archive/productions/${productionId}`)),
                )
                if (isActive) {
                    setProductions(linkedProductionResponses
                        .map((entry) => entry.data)
                        .filter((production) => !production.draft)
                    )
                }
            } catch {
                // a missing or broken linked production shouldn't 404 the blog itself
                if (isActive) setProductions([])
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
    }, [id, idIsMalformed, locale, isLoggedIn])

    if (notFound || !id || idIsMalformed) {
        return <NotFoundContent />
    }

    return (
        <>
            <div className="site-container mt-8">
                <PublicPillButton
                    icon={<LeftArrowIcon className="h-5 w-5" />}
                    label={message.blogs.navBack}
                    onClick={handleGoBack}
                    
                />
            </div>

            <div className="site-container mt-6">
                {blog && (
                    <ArchiveDetailHero
                        imageUrl={
                            // show cover image if thumbnail_index points to a valid image, otherwise fallback
                            (blog.images && typeof blog.thumbnail_index === 'number' && blog.images[blog.thumbnail_index])
                                ? blog.images[blog.thumbnail_index]!
                                : '/fallback-hero.svg'
                        }
                        title={getLocalizedTitle(blog.title, locale)}
                        superTitle={null}
                        artist={null}
                        genres={[]}
                        locale={locale}
                        shareLabel={shareCopied ? shareCopiedLabel : shareLabel}
                        onShare={() => {
                            void handleShare()
                        }}
                        isBlog={true}
                    />
                )}
            </div>

            <section className="site-container space-y-12 py-8">

                {isLoading ? <p className="text-center text-muted">{message.blogs.loadingBlog}</p> : null}
                {error ? <p className="text-center text-red-500">{error}</p> : null}

                {!isLoading && !error && blog ? (
                    <article className="space-y-8">
                        <div className="quill-detail-wrapper prose max-w-none prose-neutral text-base leading-relaxed">
                            <QuillReadOnly content={getLocalizedContent(blog.content, locale)} />
                        </div>

                        {blog.images && blog.images.length > 0 && (
                            <div className="mt-6">
                                <ArchiveDetailGallery images={blog.images.filter((_, i) => i !== blog.thumbnail_index)} />
                            </div>
                        )}

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
                                                href={withLocalePath(`/archive/${production.id}`, locale)}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </section>
                        ) : null}
                    </article>
                ) : null}
            </section>
        </>
    )
}

function BlogDetailPage() {
    return (
        <PublicLayout>
            <BlogDetailPageContent />
        </PublicLayout>
    )
}

export default BlogDetailPage