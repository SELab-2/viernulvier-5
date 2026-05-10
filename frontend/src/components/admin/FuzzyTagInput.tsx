import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import type { LocalizedText } from '../../types/production'
import { useLocale } from './useLocale'

type FuzzyTagInputProps = {
    tags: LocalizedText[]
    tag: string
    endpoint: '/archive/genres' | '/archive/tags'
    addTag: (tag: LocalizedText) => void
    onRemove: (tag: LocalizedText) => void
    onChange: (value: string) => void
    placeholder?: string
}

interface TaxonomyItem {
    name: LocalizedText
}

interface TaxonomyResponse {
    data: TaxonomyItem[]
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
    const [suggestions, setSuggestions] = useState<LocalizedText[]>([])
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
                // Search across all languages in backend now, but we still pass lang for potential prioritization
                const response = await api.get<TaxonomyResponse>(`${endpoint}?search=${tag}&lang=${locale}&limit=5`)
                if (response && response.data) {
                    // Extract all possible names from existing tags for duplicate checking
                    const existingNamesLower = tags.flatMap(t => [
                        t.nl?.toLowerCase(),
                        t.en?.toLowerCase(),
                        t.fr?.toLowerCase()
                    ].filter((v): v is string => !!v))

                    const newSuggestions = response.data
                        .map((item: TaxonomyItem) => item.name)
                        .filter((nameObj: LocalizedText) => {
                            const currentName = (nameObj[locale] || nameObj.nl || nameObj.en || '').toLowerCase()
                            // Also check if any of the localized names of this suggestion already exist
                            const suggestionNames = [nameObj.nl?.toLowerCase(), nameObj.en?.toLowerCase(), nameObj.fr?.toLowerCase()].filter((v): v is string => !!v)
                            const alreadyExists = suggestionNames.some(name => existingNamesLower.includes(name))
                            
                            return currentName !== '' && !alreadyExists
                        })
                    setSuggestions(newSuggestions)
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

    const handleSelectSuggestion = (suggestion: LocalizedText) => {
        addTag(suggestion)
        setIsOpen(false)
    }

    return (
        <div className="flex flex-col gap-2 relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t, idx) => {
                    const displayName = t[locale] || t.nl || t.en || '???'
                    return (
                        <span
                            key={`${displayName}-${idx}`}
                            className="flex items-center gap-1 rounded-full bg-accent/25 border-accent border px-3 py-1 text-xs font-bold text-foreground"
                        >
                            {displayName}
                            <button type='button' onClick={() => onRemove(t)} className="hover:opacity-70">
                                ×
                            </button>
                        </span>
                    )
                })}
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
                                // Manual add stores it in the current locale
                                addTag({ [locale]: tag.trim() })
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
                    {suggestions.map((suggestion, index) => {
                        const suggestionName = suggestion[locale] || suggestion.nl || suggestion.en || ''
                        return (
                            <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="px-4 py-2 text-sm hover:bg-accent hover:text-white cursor-pointer"
                            >
                                {suggestionName}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default FuzzyTagInput
