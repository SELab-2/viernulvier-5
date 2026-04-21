type SearchPaginationProps = {
    previousLabel: string
    nextLabel: string
    pages: string[]
    currentPage: string
    onPrevious: () => void
    onNext: () => void
    onPageSelect: (page: string) => void
    canGoPrevious: boolean
    canGoNext: boolean
}

function SearchPagination({
    previousLabel,
    nextLabel,
    pages,
    currentPage,
    onPrevious,
    onNext,
    onPageSelect,
    canGoPrevious,
    canGoNext,
}: SearchPaginationProps) {
    return (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2 text-xs text-foreground">
            <button
                type="button"
                className="h-8 w-8 rounded-full text-base hover:bg-surface disabled:opacity-35"
                aria-label={previousLabel}
                onClick={onPrevious}
                disabled={!canGoPrevious}
            >
                ‹
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    type="button"
                    className={`h-8 min-w-8 rounded-full px-2 transition ${page === currentPage ? 'bg-foreground text-surface' : 'hover:bg-surface'}`}
                    onClick={() => onPageSelect(page)}
                >
                    {page}
                </button>
            ))}

            <button
                type="button"
                className="h-8 w-8 rounded-full text-base hover:bg-surface disabled:opacity-35"
                aria-label={nextLabel}
                onClick={onNext}
                disabled={!canGoNext}
            >
                ›
            </button>
        </nav>
    )
}

export default SearchPagination
