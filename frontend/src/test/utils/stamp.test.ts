import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { parseLastEventDate, getStampInfo } from '../../utils/stamp'

describe('stamp utilities', () => {
    beforeEach(() => {
        // Mock the current date to 2026-05-12
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-12'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('parseLastEventDate', () => {
        it('returns null for empty string', () => {
            expect(parseLastEventDate('')).toBeNull()
        })

        it('returns null for whitespace only', () => {
            expect(parseLastEventDate('   ')).toBeNull()
        })

        it('parses DD.MM.YYYY format', () => {
            const result = parseLastEventDate('21.04.2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })

        it('parses DD/MM/YYYY format', () => {
            const result = parseLastEventDate('21/04/2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })

        it('parses DD-MM-YYYY format', () => {
            const result = parseLastEventDate('21-04-2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })

        it('parses single digit day and month', () => {
            const result = parseLastEventDate('1.4.2026')
            expect(result).toEqual(new Date(2026, 3, 1, 0, 0, 0, 0))
        })

        it('parses date range and uses last date', () => {
            const result = parseLastEventDate('20.04.2026 - 21.04.2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })

        it('parses date range with multiple separators', () => {
            const result = parseLastEventDate('10.04.2026 - 15.04.2026 - 21.04.2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })

        it('parses YYYY format for year-only dates', () => {
            const result = parseLastEventDate('2026')
            expect(result).toEqual(new Date(2026, 11, 31, 0, 0, 0, 0))
        })

        it('returns null for invalid date format', () => {
            expect(parseLastEventDate('invalid')).toBeNull()
        })

        it('handles invalid date values by JavaScript date overflow', () => {
            // February 30 doesn't exist, JavaScript Date will overflow
            // The result depends on how the Date constructor handles it
            const result = parseLastEventDate('30.02.2026')
            // Just check that it returns a Date object (overflow behavior)
            expect(result).not.toBeNull()
            expect(result instanceof Date).toBe(true)
        })

        it('returns null for missing parts', () => {
            expect(parseLastEventDate('21.04')).toBeNull()
        })

        it('trims whitespace in date range', () => {
            const result = parseLastEventDate('10.04.2026   -   21.04.2026')
            expect(result).toEqual(new Date(2026, 3, 21, 0, 0, 0, 0))
        })
    })

    describe('getStampInfo', () => {
        it('returns null for invalid date string', () => {
            expect(getStampInfo('invalid')).toBeNull()
        })

        it('returns null for future dates', () => {
            expect(getStampInfo('13.05.2026')).toBeNull()
        })

        it('returns days for same day', () => {
            expect(getStampInfo('12.05.2026')).toEqual({ kind: 'days', count: 0 })
        })

        it('returns days for date within same month', () => {
            expect(getStampInfo('10.05.2026')).toEqual({ kind: 'days', count: 2 })
        })

        it('returns days for multiple days', () => {
            expect(getStampInfo('01.05.2026')).toEqual({ kind: 'days', count: 11 })
        })

        it('returns months for dates 1-11 months ago', () => {
            expect(getStampInfo('12.04.2026')).toEqual({ kind: 'months', count: 1 })
        })

        it('returns months for exactly 6 months ago', () => {
            expect(getStampInfo('12.11.2025')).toEqual({ kind: 'months', count: 6 })
        })

        it('returns years when date is 12 months or more ago', () => {
            // Current date is 2026-05-12
            // 2025-05-12 is exactly 1 year = 12 months, which transitions to years
            expect(getStampInfo('12.05.2025')).toEqual({ kind: 'years', count: 1 })
        })

        it('returns years for dates 1+ years ago', () => {
            expect(getStampInfo('12.05.2025')).toEqual({ kind: 'years', count: 1 })
        })

        it('returns years for exactly 1 year ago', () => {
            // 2025-05-12 is exactly 1 year ago from 2026-05-12
            const result = getStampInfo('12.05.2025')
            expect(result?.kind).toBe('years')
            expect(result?.count).toBe(1)
        })

        it('handles month boundary when ref date is later in month than current date', () => {
            // Current: 2026-05-12, Compare: 2026-04-15
            // 12 < 15, so should subtract 1 month
            const result = getStampInfo('15.04.2026')
            expect(result?.kind).toBe('days')
        })

        it('handles month end edge case - current date at month end', () => {
            vi.setSystemTime(new Date('2026-05-31'))
            // ref date is 2026-04-30 (April 30)
            // Current date 31st > ref date 30th, so no subtraction
            const result = getStampInfo('30.04.2026')
            expect(result?.kind).toBe('months')
            expect(result?.count).toBe(1)
        })

        it('handles leap year date correctly', () => {
            vi.setSystemTime(new Date('2024-03-01'))
            // 2024 is a leap year, 2024-02-29 is valid
            const result = getStampInfo('29.02.2024')
            expect(result?.kind).toBe('days')
            expect(result?.count).toBe(1)
        })

        it('returns count of 1 minimum for years in the past', () => {
            expect(getStampInfo('12.05.1990')).toEqual({ kind: 'years', count: 36 })
        })

        it('handles year range format correctly', () => {
            // Year-only format returns Dec 31 of that year
            // 2025-12-31 to 2026-05-12 is more than 4 months but less than 5
            const result = getStampInfo('2025')
            expect(result?.kind).toBe('months')
            expect(result?.count).toBe(4)
        })

        it('handles date range with multiple dates, using last one', () => {
            expect(getStampInfo('01.05.2026 - 10.05.2026')).toEqual({ kind: 'days', count: 2 })
        })

        it('returns months for 11 months ago', () => {
            expect(getStampInfo('12.06.2025')).toEqual({ kind: 'months', count: 11 })
        })

        it('returns months=0 transitions to days=0 for same day', () => {
            const result = getStampInfo('12.05.2026')
            expect(result?.kind).toBe('days')
            expect(result?.count).toBe(0)
        })

        it('handles dates with different separators correctly', () => {
            expect(getStampInfo('12/05/2026')).toEqual({ kind: 'days', count: 0 })
            expect(getStampInfo('12-05-2026')).toEqual({ kind: 'days', count: 0 })
        })
    })
})
