import { describe, it, expect } from 'vitest'
import { calculateTotalPages } from '../../../src/utils/pagination.js'

describe('Pagination Utils', () => {
    describe('calculateTotalPages', () => {
        it('should return 0 when total is 0', () => {
            expect(calculateTotalPages(0, 10)).toBe(0)
        })

        it('should return 1 when total is less than limit', () => {
            expect(calculateTotalPages(5, 10)).toBe(1)
        })

        it('should return exact number of pages when total is multiple of limit', () => {
            expect(calculateTotalPages(20, 10)).toBe(2)
        })

        it('should round up when total is not a multiple of limit', () => {
            expect(calculateTotalPages(25, 10)).toBe(3)
        })
    })
})
