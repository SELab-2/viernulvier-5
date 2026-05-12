import { Link } from 'react-router-dom'
import { getActiveLocale, getMessages } from '../../../i18n'
import { getStampInfo } from '../../../utils/stamp'

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
    type?: 'production' | 'blog' | 'poster'
}

type SearchResultCardProps = {
    item: SearchResultItem
    detailHref?: string
    onTagClick?: (genreValue: string) => void
    genreValue?: string
}

function capitalizeFirst(value: string): string {
    if (value.length === 0) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function getPdfPreviewUrl(url: string): string {
    const hash = '#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0'
    return url.includes('#') ? url : `${url}${hash}`
}

function ProductionStamp({
    dateStr,
    stampSvgPaths,
}: {
    dateStr: string
    stampSvgPaths: {
        days: { singular: string; plural: string }
        months: { singular: string; plural: string }
        years: { singular: string; plural: string }
    }
}) {
    const info = getStampInfo(dateStr)
    if (!info) return null

    const stampSrc = info.count === 1
        ? stampSvgPaths[info.kind].singular
        : stampSvgPaths[info.kind].plural

    return (
        <div className="absolute -top-6 -right-6 z-10 h-22 w-22 select-none rounded-full bg-surface-sunken rotate-12" aria-hidden="true">
            <img src={stampSrc} alt="" className="h-full w-full brightness-50 dark:brightness-0 dark:invert" />
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold leading-none text-black dark:text-white">
                {info.count}
            </span>
        </div>
    )
}

function SearchResultCard({ item, detailHref, onTagClick, genreValue }: SearchResultCardProps) {
    const searchMessages = getMessages(getActiveLocale(window.location.pathname)).search
    const normalizedTitle = capitalizeFirst(item.title.trim())
    const displayTitle = normalizedTitle.length > 110 ? `${normalizedTitle.slice(0, 107)}...` : normalizedTitle
    const showExcerpt = Boolean(item.excerpt) && !item.isProductionReference
    const imageUrl = item.imageUrl ?? FALLBACK_IMAGE
    const isPdf = item.mimeType === 'application/pdf'
    const hasMultipleAssets = (item.relatedAssetCount ?? 0) > 1
    const previewUrls = (item.relatedAssetPreviewUrls ?? []).slice(0, 3)
    const effectiveGenreValue = (genreValue?.trim() || item.tag.trim())
    const hasClickableTag = typeof onTagClick === 'function' && effectiveGenreValue.length > 0

    const card = (
        <article className="relative flex h-full w-full flex-col border-b border-border pb-5">
            {item.type === 'production' ? (
                <ProductionStamp
                    dateStr={item.date}
                    stampSvgPaths={searchMessages.stampSvgPaths}
                />
            ) : null}
            <div className="relative h-32 overflow-hidden rounded-md sm:h-36 bg-gradient-to-br from-accent to-accent/50">
                {isPdf ? (
                    <iframe
                        src={getPdfPreviewUrl(imageUrl)}
                        title={`${item.title} PDF preview`}
                        className="absolute inset-0 h-full w-full border-0 pointer-events-none"
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
                {hasClickableTag ? (
                    <button
                        type="button"
                        className="absolute left-3 top-3 z-10 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1"
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onTagClick?.(effectiveGenreValue)
                        }}
                    >
                        {item.tag}
                    </button>
                ) : (
                    <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                        {item.tag}
                    </span>
                )}
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
                <p className="mt-3 text-sm font-semibold text-accent">{item.date}</p>
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

    const finalHref = item.detailHref ?? detailHref
    if (finalHref) {
        return (
            <Link to={finalHref} className="block h-full" aria-label={item.title}>
                {card}
            </Link>
        )
    }

    return card
}
export default SearchResultCard
