import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FuzzyTagInput from '../../../components/admin/FuzzyTagInput'
import { api } from '../../../api/client'
import type { LocalizedText } from '../../../types/production'
import type { TaxonomyItem } from '../../../types/taxonomies'

// Mock the API client
vi.mock('../../../api/client', () => ({
    api: {
        get: vi.fn()
    }
}))

// Mock the useLocale hook
vi.mock('../../../components/admin/useLocale', () => ({
    useLocale: () => ({
        locale: 'nl'
    })
}))

// Define local types to avoid backend imports during build
interface TagResponse {
    id: string
    apiId: string | null
    type: string | null
    vendor_id: string | null
    name: LocalizedText
    slug: LocalizedText
    description: LocalizedText | null
    created_at: Date
    updated_at: Date
}

interface TagListResponse {
    data: TagResponse[]
    meta: unknown
    links: unknown
}

const createMockTag = (id: string, name: string): TagResponse => ({
    id,
    apiId: null,
    type: null,
    vendor_id: null,
    name: { nl: name, en: name, fr: '' },
    slug: { nl: name.toLowerCase(), en: name.toLowerCase(), fr: '' },
    description: null,
    created_at: new Date(),
    updated_at: new Date()
})

describe('FuzzyTagInput', () => {
    const existingTag: TaxonomyItem = { id: 'TagID', name: { nl: 'ExistingTag', en: 'ExistingTag' } }
    
    const defaultProps = {
        tags: [existingTag],
        tag: '',
        locale: 'nl' as const,
        endpoint: '/archive/tags' as const,
        addTag: vi.fn(),
        onRemove: vi.fn(),
        onChange: vi.fn(),
        placeholder: 'Add tag...'
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly with tags and placeholder', () => {
        render(<FuzzyTagInput {...defaultProps} />)
        expect(screen.getByText('ExistingTag')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument()
    })

    it('calls onChange when typing', () => {
        render(<FuzzyTagInput {...defaultProps} />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.change(input, { target: { value: 'new' } })
        expect(defaultProps.onChange).toHaveBeenCalledWith('new')
    })

    it('fetches and displays suggestions when typing', async () => {
        const mockSuggestions: TagListResponse = {
            data: [
                createMockTag('mock-1', 'Suggestion 1'),
                createMockTag('mock-2', 'Suggestion 2')
            ],
            meta: { total: 2, page: 1, limit: 5, totalPages: 1 },
            links: { self: '', next: null, prev: null, first: '', last: '' }
        };
        vi.mocked(api.get).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="sug" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/archive/tags?search=sug&lang=nl&limit=5')
        })

        await waitFor(() => {
            expect(screen.getByText('Suggestion 1')).toBeInTheDocument()
            expect(screen.getByText('Suggestion 2')).toBeInTheDocument()
        })
    })

    it('filters out existing tags from suggestions case-insensitively', async () => {
        const mockSuggestions: TagListResponse = {
            data: [
                createMockTag('mock-ex', 'ExistingTag'),
                createMockTag('mock-new', 'NewTag')
            ],
            meta: { total: 2, page: 1, limit: 5, totalPages: 1 },
            links: { self: '', next: null, prev: null, first: '', last: '' }
        };
        vi.mocked(api.get).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="tag" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            const suggestions = screen.queryAllByRole('listitem')
            const suggestionTexts = suggestions.map(s => s.textContent || '')
            // ensure no suggestion contains the existing tag name, and one contains NewTag
            expect(suggestionTexts.some(t => t.includes('ExistingTag'))).toBe(false)
            expect(suggestionTexts.some(t => t.includes('NewTag'))).toBe(true)
        })
    })

    it('calls addTag when clicking a suggestion', async () => {
        const mockTag = createMockTag('mock-uuid', 'Suggestion 1')
        const mockSuggestions: TagListResponse = {
            data: [mockTag],
            meta: { total: 1, page: 1, limit: 5, totalPages: 1 },
            links: { self: '', next: null, prev: null, first: '', last: '' }
        };
        vi.mocked(api.get).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="sug" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            const suggestion = screen.getByText('Suggestion 1')
            fireEvent.click(suggestion)
        })

        expect(defaultProps.addTag).toHaveBeenCalledWith(mockTag.id, mockTag.name)
    })

    it('calls addTag when pressing Enter with a visible suggestion', async () => {
        const enterTag = createMockTag('enter-uuid', 'New Manual Tag')
        const mockSuggestions: TagListResponse = {
            data: [enterTag],
            meta: { total: 1, page: 1, limit: 5, totalPages: 1 },
            links: { self: '', next: null, prev: null, first: '', last: '' }
        };
        vi.mocked(api.get).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="New Manual Tag" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        // wait for suggestion to appear
        await waitFor(() => {
            expect(screen.getByText('New Manual Tag')).toBeInTheDocument()
        })

        fireEvent.keyDown(input, { key: 'Enter' })

        expect(defaultProps.addTag).toHaveBeenCalledWith(enterTag.id, enterTag.name)
    })

    it('disables input when amountOfTags reached', () => {
        const props = { ...defaultProps, amountOfTags: 1, tags: [existingTag] }
        render(<FuzzyTagInput {...props} />)
        const input = screen.getByPlaceholderText('Add tag...')
        expect((input as HTMLInputElement).disabled).toBe(true)
    })

    it('closes suggestions when clicking outside', async () => {
        const mockSuggestions: TagListResponse = {
            data: [createMockTag('mock-1', 'Suggestion Outside')],
            meta: { total: 1, page: 1, limit: 5, totalPages: 1 },
            links: { self: '', next: null, prev: null, first: '', last: '' }
        };
        vi.mocked(api.get).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="sug" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            expect(screen.getByText('Suggestion Outside')).toBeInTheDocument()
        })

        // click outside
        fireEvent.mouseDown(document.body)

        await waitFor(() => {
            expect(screen.queryByText('Suggestion Outside')).toBeNull()
        })
    })

    it('calls onRemove with id when clicking the remove button on a tag', () => {
        render(<FuzzyTagInput {...defaultProps} />)
        const removeButton = screen.getByText('×')
        fireEvent.click(removeButton)
        expect(defaultProps.onRemove).toHaveBeenCalledWith('TagID')
    })
})
