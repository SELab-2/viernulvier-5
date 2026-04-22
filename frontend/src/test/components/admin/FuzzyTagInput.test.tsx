import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FuzzyTagInput from '../../../components/admin/FuzzyTagInput'
import { api } from '../../../api/client'

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

describe('FuzzyTagInput', () => {
    const defaultProps = {
        tags: ['ExistingTag'],
        tag: '',
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
        const mockSuggestions = {
            data: [
                { name: { nl: 'Suggestion 1', en: 'Suggestion 1' } },
                { name: { nl: 'Suggestion 2', en: 'Suggestion 2' } }
            ]
        };
        (api.get as any).mockResolvedValue(mockSuggestions)

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
        const mockSuggestions = {
            data: [
                { name: { nl: 'ExistingTag', en: 'ExistingTag' } },
                { name: { nl: 'NewTag', en: 'NewTag' } }
            ]
        };
        (api.get as any).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="tag" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            // "ExistingTag" should exist as a badge but NOT as a list item (suggestion)
            // List items are <li> elements
            const suggestions = screen.queryAllByRole('listitem')
            const suggestionTexts = suggestions.map(s => s.textContent)
            expect(suggestionTexts).not.toContain('ExistingTag')
            expect(suggestionTexts).toContain('NewTag')
        })
    })

    it('calls addTag when clicking a suggestion', async () => {
        const mockSuggestions = {
            data: [
                { name: { nl: 'Suggestion 1', en: 'Suggestion 1' } }
            ]
        };
        (api.get as any).mockResolvedValue(mockSuggestions)

        render(<FuzzyTagInput {...defaultProps} tag="sug" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.focus(input)

        await waitFor(() => {
            const suggestion = screen.getByText('Suggestion 1')
            fireEvent.click(suggestion)
        })

        expect(defaultProps.addTag).toHaveBeenCalledWith('Suggestion 1')
    })

    it('calls addTag when pressing Enter', () => {
        render(<FuzzyTagInput {...defaultProps} tag="New Manual Tag" />)
        const input = screen.getByPlaceholderText('Add tag...')
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(defaultProps.addTag).toHaveBeenCalledWith('New Manual Tag')
    })

    it('calls onRemove when clicking the remove button on a tag', () => {
        render(<FuzzyTagInput {...defaultProps} />)
        const removeButton = screen.getByText('×')
        fireEvent.click(removeButton)
        expect(defaultProps.onRemove).toHaveBeenCalledWith('ExistingTag')
    })
})
