import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Locale } from '../../i18n/types'
import { toPlainText } from '../../utils/text'

type LocalizedText = {
    nl?: string
    fr?: string
    en?: string
} | null

export type ProductionCardItem = {
    id: string
    title: LocalizedText
    artist?: LocalizedText
    description_short?: LocalizedText
    description?: LocalizedText
    teaser?: LocalizedText
    image_url?: string | null
    created_at?: string
    venue_name?: string | null
    venue_names?: string[]
    attendance_mode?: string | null
}

type ProductionCardProps = {
    production: ProductionCardItem
    locale: Locale
    href?: string
    className?: string
    selected?: boolean
    action?: ReactNode
}

function getLocalizedText(value: LocalizedText, locale: Locale): string {
    if (!value) {
        return ''
    }

    return (value[locale] ?? value.nl ?? value.en ?? value.fr ?? '').trim()
}

function getProductionLabel(production: ProductionCardItem, locale: Locale): string {
    return getLocalizedText(production.title, locale) || production.id
}

function getProductionDisplayTitle(production: ProductionCardItem, locale: Locale): string {
    const title = getLocalizedText(production.title, locale)
    const artist = getLocalizedText(production.artist ?? null, locale)

    if (title && artist) {
        const normalizedTitle = title.trim().toLowerCase()
        const normalizedArtist = artist.trim().toLowerCase()

        if (normalizedTitle === normalizedArtist) {
            return title
        }

        return `${title} — ${artist}`
    }

    if (title) {
        return title
    }

    if (artist) {
        return artist
    }

    return production.id
}

function getProductionExcerpt(production: ProductionCardItem, locale: Locale): string {
    const raw = getLocalizedText(production.description_short ?? null, locale)
        || getLocalizedText(production.description ?? null, locale)
        || getLocalizedText(production.teaser ?? null, locale)
        || getProductionLabel(production, locale)

    const plain = toPlainText(raw)
    return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain
}

function getProductionDate(production: ProductionCardItem, locale: Locale): string {
    if (!production.created_at) {
        return ''
    }

    const date = new Date(production.created_at)
    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date)
}

function ProductionCard({ production, locale, href, className = '', selected = false, action }: ProductionCardProps) {
    const label = getProductionLabel(production, locale)
    const displayTitle = getProductionDisplayTitle(production, locale)
    const excerpt = getProductionExcerpt(production, locale)
    const date = getProductionDate(production, locale)

    const cardClassName = [
        'relative rounded-xl border transition',
        selected ? 'border-[var(--color-accent)] bg-surface' : 'border-border bg-background hover:border-[var(--color-accent)]/60',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    const content = (
        <article className="flex w-full flex-col p-3">
            <div className="relative h-24 overflow-hidden rounded-md bg-gradient-to-br from-accent to-accent/50">
                {production.image_url ? (
                    <img
                        src={production.image_url}
                        alt={label}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                ) : null}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <p className="mt-2 text-xs text-text-accent">{date}</p>
            <h3 className="mt-1 line-clamp-2 text-lg leading-tight text-foreground [overflow-wrap:anywhere]">{displayTitle}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-text-accent">{excerpt}</p>
        </article>
    )

    return (
        <div className={cardClassName}>
            {action ? <div className="absolute right-3 top-3 z-10">{action}</div> : null}
            {href ? (
                <Link to={href} className="block">
                    {content}
                </Link>
            ) : (
                content
            )}
        </div>
    )
}

export default ProductionCard