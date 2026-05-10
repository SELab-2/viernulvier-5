import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'
import { usePublicMessages } from './PublicMessagesContext'

function PublicLatestBlogPreview() {
    const messages = usePublicMessages()

    return (
        <section className="py-16 bg-foreground/3">
            <SectionTitle title={messages.home.latestBlogHeading} subtitle={messages.home.latestBlogSubheading} />

            <article className="site-container grid items-stretch gap-12 lg:grid-cols-[1fr_auto_1.1fr]">
                <div className="relative h-[420px] overflow-hidden border border-border bg-surface sm:h-[560px]">
                    <div className="absolute inset-0 bg-foreground" />
                    <div className="absolute left-6 top-6 rounded-full border border-white/50 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        placeholder
                    </div>
                </div>

                <div aria-hidden className="hidden w-px self-stretch bg-foreground/25 lg:block" />

                <div className="flex h-full flex-col justify-between py-3">
                    <div>
                        <h3 className="text-2xl font-medium leading-tight text-foreground">{messages.home.latestBlogTitle}</h3>
                        <p className="mt-6 text-lg leading-relaxed text-text-accent">{messages.home.latestBlogParagraphOne}</p>

                        <h4 className="mt-8 text-xl font-medium text-foreground">{messages.home.latestBlogParagraphTwoTitle}</h4>
                        <p className="mt-3 text-lg leading-relaxed text-text-accent">{messages.home.latestBlogParagraphTwo}</p>
                    </div>
                    <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                        <PublicPillButton label={messages.home.latestBlogReadMore} variant="outline" />
                        <PublicPillButton label={messages.home.latestBlogViewAll} />
                    </div>
                </div>
            </article>
        </section>
    )
}

export default PublicLatestBlogPreview
