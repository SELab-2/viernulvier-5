import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'

type PublicLatestBlogPreviewProps = {
    heading: string
    subheading: string
    title: string
    paragraphOne: string
    paragraphTwoTitle: string
    paragraphTwo: string
    readMoreLabel: string
    viewAllLabel: string
}

function PublicLatestBlogPreview({
    heading,
    subheading,
    title,
    paragraphOne,
    paragraphTwoTitle,
    paragraphTwo,
    readMoreLabel,
    viewAllLabel,
}: PublicLatestBlogPreviewProps) {
    return (
        <section className="py-16 bg-foreground/3">
            <SectionTitle title={heading} subtitle={subheading} />

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
                        <h3 className="text-2xl font-medium leading-tight text-foreground">{title}</h3>
                        <p className="mt-6 text-lg leading-relaxed text-text-accent">{paragraphOne}</p>

                        <h4 className="mt-8 text-xl font-medium text-foreground">{paragraphTwoTitle}</h4>
                        <p className="mt-3 text-lg leading-relaxed text-text-accent">{paragraphTwo}</p>
                    </div>
                    <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                        <PublicPillButton label={readMoreLabel} variant="outline" />
                        <PublicPillButton label={viewAllLabel} />
                    </div>
                </div>
            </article>
        </section>
    )
}

export default PublicLatestBlogPreview
