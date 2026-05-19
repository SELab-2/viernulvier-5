export function LeftChevronIcon({ className }: { className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className={className}
        >
            <path
                d="M16 5l-8 7 8 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function RightChevronIcon({ className }: { className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className={className}
        >
            <path
                d="M8 5l8 7-8 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function LeftArrowIcon({ className }: { className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className={className}
        >
            <path
                d="M19 12H5m0 0l6-6m-6 6l6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function RightArrowIcon({ className }: { className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className={className}
        >
            <path
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}