import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import type { LocalizedText } from '../../types/production'
import type { TaxonomyItem, TaxonomyResponse } from '../../types/taxonomies'
import { useLocale } from './useLocale'

type FuzzyTagInputProps = {
    tags: TaxonomyItem[]
    tag: string
    endpoint: '/archive/genres' | '/archive/tags' | '/archive/halls'
    addTag: (id: string, text: LocalizedText) => void
    onRemove: (id: string) => void
    onChange: (value: string) => void
    amountOfTags?: number
    placeholder?: string
}


function FuzzyTagInput({
    tags,
    tag,
    endpoint,
    addTag,
    onRemove,
    onChange,
    placeholder,
    amountOfTags
}: FuzzyTagInputProps) {
    const { locale } = useLocale();
    const [suggestions, setSuggestions] = useState<TaxonomyItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const defaultPlaceholder = locale === 'nl' ? 'Toevoegen...' : 'Add...'
    const activePlaceholder = placeholder || defaultPlaceholder
    
    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (tag.length < 1) {
                setSuggestions([]);
                return;
            }

            try {
                // Search across all languages in backend now, but we still pass lang for potential prioritization
                const response = await api.get<TaxonomyResponse>(`${endpoint}?search=${tag}&lang=${locale}&limit=5`)
                
                if (response && response.data) {
                    // Extract all possible names from existing tags for duplicate checking
                    const existingNamesLower = tags.flatMap(t => [
                        t.name?.nl?.toLowerCase(),
                        t.name?.en?.toLowerCase(),
                        t.name?.fr?.toLowerCase()
                    ].filter((v): v is string => !!v));

                    const newSuggestions = response.data.filter((item: TaxonomyItem) => {
                        const nameObj = item.name;
                        if (!nameObj) return false;
                        const currentName = (nameObj[locale] || nameObj.nl || nameObj.en || '').toLowerCase();
                        const suggestionNames = [nameObj.nl?.toLowerCase(), nameObj.en?.toLowerCase()]
                            .map(v => v?.toLowerCase())
                            .filter((v): v is string => !!v);
                        const alreadyExists = suggestionNames.some(name => existingNamesLower.includes(name));
                        return currentName !== '' && !alreadyExists;
                    });
                    setSuggestions(newSuggestions);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error)
            }
        }

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [tag, endpoint, tags, locale])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [])

    const handleSelectSuggestion = (suggestion: TaxonomyItem) => {
        addTag(suggestion.id, suggestion.name);
        setIsOpen(false);
        setCreateError(null);
    }

    const getDisplayName = (item: TaxonomyItem): string => {
        return item.name?.[locale] || item.name?.nl || item.name?.en || item.name?.fr || ''
    }

    const toSlug = (value: string): string => {
        return value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const resolveOrCreateTaxonomy = async (rawValue: string) => {
        const value = rawValue.trim()
        if (!value) return

        const exactInSuggestions = suggestions.find((item) => getDisplayName(item).toLowerCase() === value.toLowerCase())
        if (exactInSuggestions) {
            handleSelectSuggestion(exactInSuggestions)
            return
        }

        if (endpoint === '/archive/halls') {
            if (suggestions.length > 0) {
                handleSelectSuggestion(suggestions[0])
            }
            return
        }

        setIsCreating(true)
        setCreateError(null)

        try {
            const existingResponse = await api.get<TaxonomyResponse>(`${endpoint}?search=${encodeURIComponent(value)}&lang=${locale}&limit=20`)
            const exactExisting = existingResponse.data.find((item) => {
                const names = [item.name?.nl, item.name?.en, item.name?.fr]
                    .map((name) => (name ?? '').trim().toLowerCase())
                    .filter((name) => name.length > 0)
                return names.includes(value.toLowerCase())
            })

            if (exactExisting) {
                addTag(exactExisting.id, exactExisting.name)
                setIsOpen(false)
                return
            }

            const localizedName: LocalizedText = { [locale]: value }
            const slugValue = toSlug(value)
            const localizedSlug: LocalizedText = slugValue ? { [locale]: slugValue } : null

            const created = await api.post<{ data: TaxonomyItem }>(endpoint, {
                name: localizedName,
                slug: localizedSlug,
            })

            addTag(created.data.id, created.data.name)
            setIsOpen(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create taxonomy'
            setCreateError(message)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="flex flex-col relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t, idx) => {
                    const displayName = t.name?.[locale] || t.name?.nl || t.name?.en || '???'
                    return (
                        <span
                            key={`${displayName}-${idx}`}
                            className="flex items-center gap-1 rounded-full bg-accent/25 border-accent border px-3 py-1 text-xs font-bold text-foreground"
                        >
                            {displayName}
                            <button type='button' onClick={() => onRemove(t.id)} className="hover:opacity-70">
                                ×
                            </button>
                        </span>
                    )
                })}
            </div>
            <div className="border border-border gap-2 flex h-12 items-center rounded-md bg-surface px-4 text-muted">
                <input
                    type="text"
                    value={tag}
                    disabled={amountOfTags !== undefined ? tags.length >= amountOfTags : false }
                    onChange={e => {
                        onChange(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            if (tag.trim()) {
                                void resolveOrCreateTaxonomy(tag)
                            }
                        }
                    }}
                    placeholder={activePlaceholder}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                />
            </div>

            {createError ? (
                <p className="mt-1 text-xs text-red-500">{createError}</p>
            ) : null}

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-surface border border-border rounded-lg shadow-xl top-full mt-1 overflow-hidden">
                    {suggestions.map((suggestion) => {
                        const suggestionName = suggestion.name?.[locale] || suggestion.name?.nl || suggestion.name?.en || ''
                        return (
                            <li
                                key={suggestion.id}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 cursor-pointer transition-colors duration-100 group border-b border-border/40 last:border-0"
                            >
                                <span className="font-medium">{suggestionName}</span>
                                <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                    Add ↵
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}

            {isCreating ? (
                <p className="mt-1 text-xs text-muted">Saving...</p>
            ) : null}
        </div>
    )
}

export default FuzzyTagInput
