import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'
import { getMessages } from '../../i18n'

type PublicLatestBlogPreviewProps = {
    blog: {
        id: string
        title: string
        excerpt: string
    } | null
    onReadMore: (id: string) => void
    onViewAll: () => void
}

function PublicLatestBlogPreview({ blog, onReadMore, onViewAll }: PublicLatestBlogPreviewProps) {
    const messages = getMessages()

    if (!blog) {
        return null
    }

    return (
        <section className="py-16 bg-foreground/3">
            <SectionTitle title={messages.home.latestBlogHeading} subtitle={messages.home.latestBlogSubheading} />

            <article className="site-container grid items-stretch gap-12 lg:grid-cols-[1fr_auto_1.1fr]">
                <div className="relative h-[420px] overflow-hidden border border-border bg-surface sm:h-[560px]">
                    <div className="absolute inset-0 bg-foreground" />
                </div>

                <div aria-hidden className="hidden w-px self-stretch bg-foreground/25 lg:block" />

                <div className="flex h-full flex-col justify-between py-3">
                    <div>
                        <h3 className="text-2xl font-medium leading-tight text-foreground">{blog.title}</h3>
                        <p className="mt-6 text-lg leading-relaxed text-text-accent">{blog.excerpt}</p>
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
