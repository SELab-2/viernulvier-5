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
    type?: 'production' | 'blog' | 'poster'
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

function parseLastEventDate(dateStr: string): Date | null {
    if (!dateStr.trim()) return null
    const parts = dateStr.split(' - ')
    const lastPart = parts[parts.length - 1].trim()
    const ddmmyyyy = lastPart.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})$/)
    if (ddmmyyyy) {
        const date = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]))
        return isNaN(date.getTime()) ? null : date
    }
    const yyyy = lastPart.match(/^(\d{4})$/)
    if (yyyy) {
        return new Date(Number(yyyy[1]), 11, 31)
    }
    return null
}

function getStampInfo(dateStr: string): { kind: 'days' | 'months' | 'years'; count: number } | null {
    const date = parseLastEventDate(dateStr)
    if (!date) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const ref = new Date(date)
    ref.setHours(0, 0, 0, 0)
    const diffMs = now.getTime() - ref.getTime()
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 31) return { kind: 'days', count: diffDays }
    let months = (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth())
    if (now.getDate() < ref.getDate()) months -= 1
    months = Math.max(0, months)
    if (months < 12) return { kind: 'months', count: months }
    let years = now.getFullYear() - ref.getFullYear()
    if (now.getMonth() < ref.getMonth() || (now.getMonth() === ref.getMonth() && now.getDate() < ref.getDate())) years -= 1
    return { kind: 'years', count: Math.max(1, years) }
}

function getStampSrc(kind: 'days' | 'months' | 'years', count: number, stampMessages: Record<string, { singular: string; plural: string }>): string {
    // Get SVG path from message configuration
    // This supports language-specific SVG assets for future multi-language support
    const isSingular = count === 1
    const paths = stampMessages[kind]
    return isSingular ? paths.singular : paths.plural
}

function ProductionStamp({ dateStr, stampMessages }: { dateStr: string; stampMessages: Record<string, { singular: string; plural: string }> }) {
    const info = getStampInfo(dateStr)
    if (!info) return null
    const stampSrc = getStampSrc(info.kind, info.count, stampMessages)

    return (
        <div className="absolute -top-6 -right-6 z-10 h-22 w-22 select-none rounded-full bg-surface-sunken rotate-12" aria-hidden="true">
            <img src={stampSrc} alt="" className="h-full w-full brightness-50" />
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold leading-none text-black">
                {info.count}
            </span>
        </div>
    )
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
        <article className="relative flex h-full w-full flex-col border-b border-border pb-5">
            {item.type === 'production' ? <ProductionStamp dateStr={item.date} stampMessages={searchMessages.stampSvgPaths} /> : null}
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
