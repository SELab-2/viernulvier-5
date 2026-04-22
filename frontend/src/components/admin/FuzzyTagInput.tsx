import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import type { TagListResponse } from '../../../../backend/src/modules/taxonomies/taxonomies.schema'
import { useLocale } from './useLocale'

type FuzzyTagInputProps = {
    tags: string[]
    tag: string
    endpoint: '/archive/genres' | '/archive/tags'
    addTag: (tagName: string) => void
    onRemove: (tag: string) => void
    onChange: (value: string) => void
    placeholder?: string
}

function FuzzyTagInput({
    tags,
    tag,
    endpoint,
    addTag,
    onRemove,
    onChange,
    placeholder
}: FuzzyTagInputProps) {
    const { locale } = useLocale()
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const defaultPlaceholder = locale === 'nl' ? 'Toevoegen...' : 'Add...'
    const activePlaceholder = placeholder || defaultPlaceholder

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (tag.length < 1) {
                setSuggestions([])
                return
            }

            try {
                const response = await api.get<TagListResponse>(`${endpoint}?search=${tag}&lang=${locale}&limit=5`)
                if (response && response.data) {
                    // Extract names and filter out already added tags (case-insensitive check)
                    const lowerTags = tags.map(t => t.toLowerCase())
                    const names = response.data
                        .map(item => item.name?.[locale] || item.name?.nl || item.name?.en || '')
                        .filter(name => name !== '' && !lowerTags.includes(name.toLowerCase()))
                    setSuggestions(names)
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error)
            }
        }

        const timer = setTimeout(fetchSuggestions, 300)
        return () => clearTimeout(timer)
    }, [tag, endpoint, tags, locale])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectSuggestion = (suggestion: string) => {
        addTag(suggestion)
        setIsOpen(false)
    }

    return (
        <div className="flex flex-col gap-2 relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                    <span
                        key={t}
                        className="flex items-center gap-1 rounded-full bg-accent/25 border-accent border px-3 py-1 text-xs font-bold text-foreground"
                    >
                        {t}
                        <button type='button' onClick={() => onRemove(t)} className="hover:opacity-70">
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <div className="border border-border mb-8 gap-2 w-9/10 flex h-12 items-center rounded-md bg-background px-4 text-muted">
                <input
                    type="text"
                    value={tag}
                    onChange={e => {
                        onChange(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            if (tag.trim()) {
                                addTag(tag.trim())
                                setIsOpen(false)
                            }
                        }
                    }}
                    placeholder={activePlaceholder}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                />
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 w-9/10 bg-surface border border-border rounded-md shadow-lg top-full -mt-7 max-h-40 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="px-4 py-2 text-sm hover:bg-accent hover:text-white cursor-pointer"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default FuzzyTagInput
