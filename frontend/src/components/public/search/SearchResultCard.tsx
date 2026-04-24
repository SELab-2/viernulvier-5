import { Link } from 'react-router-dom'
import { getActiveLocale, getMessages } from '../../../i18n'

const FALLBACK_IMAGE = '/fallback-hero.svg'

export type SearchResultItem = {
    id: string
    tag: string
    date: string
    title: string
    excerpt: string
    venue: string
    imageUrl?: string
    mimeType?: string | null
    relatedAssetCount?: number
    relatedAssetPreviewUrls?: string[]
    isProductionReference?: boolean
    detailHref?: string
}

type SearchResultCardProps = {
    item: SearchResultItem
}

function capitalizeFirst(value: string): string {
    if (value.length === 0) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function getPdfPreviewUrl(url: string): string {
    const hash = '#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0'
    return url.includes('#') ? url : `${url}${hash}`
}

function SearchResultCard({ item }: SearchResultCardProps) {
    const searchMessages = getMessages(getActiveLocale(window.location.pathname)).search
    const normalizedTitle = capitalizeFirst(item.title.trim())
    const displayTitle = normalizedTitle.length > 110 ? `${normalizedTitle.slice(0, 107)}...` : normalizedTitle
    const showExcerpt = Boolean(item.excerpt) && !item.isProductionReference
    const imageUrl = item.imageUrl ?? FALLBACK_IMAGE
    const isPdf = item.mimeType === 'application/pdf'
    const hasMultipleAssets = (item.relatedAssetCount ?? 0) > 1
    const previewUrls = (item.relatedAssetPreviewUrls ?? []).slice(0, 3)

    const card = (
        <article className="flex h-full w-full flex-col border-b border-border pb-5">
            <div className="relative h-32 overflow-hidden rounded-md sm:h-36 bg-gradient-to-br from-accent to-accent/50">
                {isPdf ? (
                    <iframe
                        src={getPdfPreviewUrl(imageUrl)}
                        title={`${item.title} PDF preview`}
                        className="absolute inset-0 h-full w-full border-0"
                        loading="lazy"
                    />
                ) : (
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                    {item.tag}
                </span>
                {hasMultipleAssets ? (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border border-white/45 bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        <div className="flex items-center -space-x-2">
                            {previewUrls.map((previewUrl, index) => (
                                <span
                                    key={`${previewUrl}-${index}`}
                                    className="h-4 w-4 overflow-hidden rounded-full border border-white/65 bg-white/20"
                                >
                                    <img src={previewUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                                </span>
                            ))}
                        </div>
                        <span>{searchMessages.relatedFilesCount(item.relatedAssetCount ?? 0)}</span>
                    </div>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col">
                <p className="mt-3 text-xs text-text-accent">{item.date}</p>
                <h3 className="mt-1 line-clamp-3 text-2xl leading-none text-foreground [overflow-wrap:anywhere]">{displayTitle}</h3>
                <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${showExcerpt ? 'text-text-accent' : 'invisible'}`}>
                    {showExcerpt ? item.excerpt : '\u00a0'}
                </p>
                <p className="mt-auto line-clamp-2 pt-4 text-xs font-semibold lowercase tracking-wide text-text-accent">
                    {item.isProductionReference ? `∋ ${item.venue}` : item.venue}
                </p>
            </div>
        </article>
    )

    if (item.detailHref) {
        return (
            <Link to={item.detailHref} className="block h-full">
                {card}
            </Link>
        )
    }

    return card
}
export default SearchResultCard
