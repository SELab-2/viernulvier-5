import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'
import { usePublicMessages } from './PublicMessagesContext'
import type { Blog } from '../../api/blogs'
import { getLocalizedTitle, getLocalizedContent, normalizeContent } from '../../pages/public/blogDetailPage.formatters'
import { toPlainText } from '../../utils/text'
import { resolveBlogImageUrl } from '../admin/blogs/blogImageUrl'

type PublicLatestBlogPreviewProps = {
    blog: Blog | null
    locale: 'nl' | 'en'
    fallbackUntitled: string
    onReadMore: (id: string) => void
    onViewAll: () => void
}

function PublicLatestBlogPreview({ blog, locale, fallbackUntitled, onReadMore, onViewAll }: PublicLatestBlogPreviewProps) {
    const messages = usePublicMessages()

    if (!blog) {
        return null
    }

    const title = getLocalizedTitle(blog.title, locale) || fallbackUntitled
    const localizedContent = getLocalizedContent(blog.content, locale)
    const delta = normalizeContent(localizedContent)
    const excerptRaw = delta
        ? delta.ops
            .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
            .join('')
            .replace(/\s+/g, ' ')
            .trim()
        : toPlainText(typeof localizedContent === 'string' ? localizedContent : '')

    const excerpt = excerptRaw.length > 320 ? `${excerptRaw.slice(0, 317)}...` : excerptRaw

    return (
        <section className="py-16 bg-foreground/3">
            <SectionTitle title={messages.home.latestBlogHeading} subtitle={messages.home.latestBlogSubheading} />

            <article className="site-container grid items-stretch gap-12 lg:grid-cols-[1fr_auto_1.1fr]">
                <div className="relative h-[420px] overflow-hidden border border-border bg-surface sm:h-[560px]" aria-hidden="true">
                    <img
                        src={
                            Array.isArray(blog.images) && typeof blog.thumbnail_index === 'number' && blog.images[blog.thumbnail_index]
                                ? resolveBlogImageUrl(blog.images[blog.thumbnail_index]!)
                                : '/fallback-hero.svg'
                        }
                        alt=""
                        className="h-full w-full object-cover rounded-lg"
                    />
                </div>
                <div aria-hidden className="hidden w-px self-stretch bg-foreground/25 lg:block" />

                <div className="flex h-full flex-col justify-between py-3">
                    <div>
                        <h3 className="text-2xl font-medium leading-tight text-foreground">{title}</h3>
                        <p className="mt-6 text-lg leading-relaxed text-text-accent">{excerpt}</p>
                    </div>
                    <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                        <PublicPillButton label={messages.home.latestBlogReadMore} variant="outline" onClick={() => onReadMore(blog.id)} />
                        <PublicPillButton label={messages.home.latestBlogViewAll} onClick={onViewAll} />
                    </div>
                </div>
            </article>
        </section>
    )
}

export default PublicLatestBlogPreview
