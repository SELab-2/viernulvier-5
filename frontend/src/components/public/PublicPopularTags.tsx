import { useState, useEffect, useRef, useCallback } from 'react'
import { getMessages } from '../../i18n'

type PublicPopularTagsProps = {
    onTagClick: (tag: string) => void
}

// Tailwind gap-3 = 0.75rem. At 16px base that is 12px.
const GAP_PX = 12

function PublicPopularTags({ onTagClick }: PublicPopularTagsProps) {
    const messages = getMessages()
    const tags = messages.home.popularTags

    const [expanded, setExpanded] = useState(false)
    // Start with all visible so SSR/jsdom never flickers to 0
    const [visibleCount, setVisibleCount] = useState(tags.length)

    const rowRef = useRef<HTMLDivElement>(null)
    const ghostTagsRef = useRef<HTMLDivElement>(null)
    const ghostMoreRef = useRef<HTMLButtonElement>(null)

    const recalculate = useCallback(() => {
        const row = rowRef.current
        const ghostTags = ghostTagsRef.current
        const ghostMore = ghostMoreRef.current
        if (!row || !ghostTags || !ghostMore) return

        const rowWidth = row.offsetWidth
        if (rowWidth === 0) return

        const tagWidths = Array.from(ghostTags.children).map(
            (el) => (el as HTMLElement).offsetWidth,
        )

        // Check if every tag fits in a single row without a "more" button
        const totalTagsWidth = tagWidths.reduce(
            (sum, w, i) => sum + w + (i > 0 ? GAP_PX : 0),
            0,
        )
        if (totalTagsWidth <= rowWidth) {
            setVisibleCount(tags.length)
            return
        }

        // Calculate how many fit when reserving space for the "more" button
        const moreWidth = ghostMore.offsetWidth
        const available = rowWidth - moreWidth - GAP_PX
        let used = 0
        let count = 0
        for (let i = 0; i < tagWidths.length; i++) {
            const w = tagWidths[i] + (i > 0 ? GAP_PX : 0)
            if (used + w > available) break
            used += w
            count++
        }

        setVisibleCount(Math.max(count, 1))
    }, [tags.length])

    useEffect(() => {
        const row = rowRef.current
        if (!row) return

        const observer = new ResizeObserver(recalculate)
        observer.observe(row)

        const frameId = window.requestAnimationFrame(recalculate)

        return () => {
            observer.disconnect()
            window.cancelAnimationFrame(frameId)
        }
    }, [recalculate])

    const needsMore = visibleCount < tags.length
    const displayTags = expanded ? tags : tags.slice(0, visibleCount)

    return (
        <section className="mt-14 bg-[var(--color-accent)] py-8">
            <div className="site-container flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
                <p className="shrink-0 text-center text-xl text-white sm:text-left">{messages.home.popularTagsLabel}</p>

                {/* Ghost elements — off-screen, used only for measurement */}
                <div
                    ref={ghostTagsRef}
                    aria-hidden="true"
                    className="pointer-events-none invisible fixed left-[-9999px] top-0 flex gap-3"
                >
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="shrink-0 rounded-full bg-white px-5 py-2 text-base text-black"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <button
                    ref={ghostMoreRef}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="pointer-events-none invisible fixed left-[-9999px] top-0 shrink-0 rounded-full border border-dashed border-white px-6 py-2 text-base text-white"
                >
                    {messages.home.popularTagsMore}
                </button>

                {/* Visible row — takes remaining width */}
                <div
                    ref={rowRef}
                    className={`flex min-w-0 flex-1 flex-wrap justify-center gap-3 sm:justify-start ${expanded ? '' : 'overflow-hidden sm:flex-nowrap'}`}
                >
                    {displayTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => onTagClick(tag)}
                            className="shrink-0 rounded-full bg-white px-5 py-2 text-base text-black transition hover:bg-zinc-100"
                        >
                            {tag}
                        </button>
                    ))}
                    {needsMore && (
                        <button
                            type="button"
                            onClick={() => setExpanded((prev) => !prev)}
                            className="shrink-0 rounded-full border border-dashed border-white px-6 py-2 text-base text-white transition hover:bg-white/10"
                        >
                            {expanded ? messages.home.popularTagsLess : messages.home.popularTagsMore}
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}

export default PublicPopularTags
