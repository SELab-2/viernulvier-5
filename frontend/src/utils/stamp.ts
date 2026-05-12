export function parseLastEventDate(dateStr: string): Date | null {
    if (!dateStr.trim()) return null
    const parts = dateStr.split(' - ')
    const lastPart = parts[parts.length - 1].trim()
    const ddmmyyyy = lastPart.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
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

export function getStampInfo(dateStr: string): { kind: 'days' | 'months' | 'years'; count: number } | null {
    const date = parseLastEventDate(dateStr)
    if (!date) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const ref = new Date(date)
    ref.setHours(0, 0, 0, 0)
    const diffMs = now.getTime() - ref.getTime()
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let months = (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth())
    if (now.getDate() < ref.getDate()) {
        const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const isNowAtMonthEnd = now.getDate() === daysInCurrentMonth
        const refDayFallsOutsideCurrentMonth = ref.getDate() > daysInCurrentMonth
        if (!(isNowAtMonthEnd && refDayFallsOutsideCurrentMonth)) {
            months -= 1
        }
    }
    months = Math.max(0, months)
    if (months === 0) return { kind: 'days', count: diffDays }
    if (months < 12) return { kind: 'months', count: months }
    let years = now.getFullYear() - ref.getFullYear()
    if (now.getMonth() < ref.getMonth() || (now.getMonth() === ref.getMonth() && now.getDate() < ref.getDate())) years -= 1
    return { kind: 'years', count: Math.max(1, years) }
}
