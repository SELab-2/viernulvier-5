import { useEffect, useMemo, useState } from 'react'
import { api, apiFetch } from '../../api/client'
import { getMessages } from '../../i18n'
import Quill from 'quill'

import { useNavigate, useParams } from 'react-router-dom'
import SectionHeading from '../../components/admin/SectionHeading'
import BlogsTab from '../../components/admin/BlogsTab'
import BlogsTabContent from '../../components/admin/BlogsTabContent'
import PublicNavbar from '../../components/public/PublicNavbar'

import EditHeader from '../../components/admin/EditHeader'
import ProductionManagementSection, { type ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'

import type { Language, BlogContent } from '../../types/blog'
import type { Locale } from '../../i18n/types'

type ProductionListResponse = {
    data: ProductionItem[]
}

type Title = {
    nl: string,
    en: string
}

type ProductionDetailResponse = {
    data: ProductionItem
}

type BlogDetail = {
    id: string
    title?: string | null
    content?: unknown
    productions?: string[]
}

type BlogDetailResponse = {
    data: BlogDetail
}

function mergeUniqueProductions(productionList: ProductionItem[]): ProductionItem[] {
    const byId = new Map<string, ProductionItem>()

    for (const production of productionList) {
        byId.set(production.id, production)
    }

    return Array.from(byId.values())
}

function getEditorHtml(value: unknown): string {
    if (!value) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'object' && value !== null && 'ops' in value) {
        const container = document.createElement('div')
        const quill = new Quill(container)
        quill.setContents(value as never)
        return quill.root.innerHTML
    }

    return ''
}

const defaultForm: BlogContent = {
    nl: { title: '', content: '' },
    en: { title: '', content: '' },
}

function CreateBlogPage() {
    const { id: blogId } = useParams<{ id: string }>()

    /*Edit mode if the blog already exists*/
    const isEditMode = Boolean(blogId)

    const [languageTab, setLanguageTab] = useState<Locale>('nl')
    const [form, setForm] = useState<BlogContent>(defaultForm)
    const [contentJson, setContentJson] = useState<Record<Locale, unknown | null>>({
        nl: null,
        en: null,
    })
    const [isLoadingBlog, setIsLoadingBlog] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [productions, setProductions] = useState<ProductionItem[]>([])
    const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([])
    const [productionToAdd, setProductionToAdd] = useState('')
    const [productionSearchQuery, setProductionSearchQuery] = useState('')
    const [isProductionPopupOpen, setIsProductionPopupOpen] = useState(false)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
    const [productionsError, setProductionsError] = useState('')

    const navigate = useNavigate()
    const messages = getMessages()

    const languageOptions: { key: Language; label: string }[] = [
        { key: 'nl', label: messages.blogs.dutchOption },
        { key: 'en', label: messages.blogs.englishOption },
    ]

    useEffect(() => {
        if (!isEditMode || !blogId) {
            setForm(defaultForm)
            setContentJson({ nl: null, en: null })
            setSelectedProductionIds([])
            return
        }

        let isActive = true

        const loadBlog = async () => {
            setIsLoadingBlog(true)
            setError('')

            try {
                const response = await api.get<BlogDetailResponse>(`/archive/blogs/${blogId}`)
                if (!isActive) {
                    return
                }

                
                const localizedTitle = JSON.parse(response.data.title!) as Title
                const localizedContent = response.data.content as BlogContent

                setForm({
                    nl: {
                        title: localizedTitle.nl,
                        content: getEditorHtml(localizedContent.nl),
                    },
                    en: {
                        title: localizedTitle.en,
                        content: getEditorHtml(localizedContent.en),
                    },
                })
                setContentJson(localizedContent)

                setSelectedProductionIds(response.data.productions ?? [])
            } catch (loadError) {
                if (isActive) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load blog.')
                }
            } finally {
                if (isActive) {
                    setIsLoadingBlog(false)
                }
            }
        }

        void loadBlog()

        return () => {
            isActive = false
        }
    }, [blogId, isEditMode])

    // Load productions for popup (filtered by query)
    useEffect(() => {
        const fetchProductions = async () => {
            setIsLoadingProductions(true)
            setProductionsError('')

            try {
                const query = productionSearchQuery.trim()
                const endpoint = query
                    ? `/archive/productions?page=1&search=${encodeURIComponent(query)}`
                    : '/archive/productions?page=1'

                const response = await api.get<ProductionListResponse>(endpoint)
                setProductions((current) => mergeUniqueProductions([...current, ...response.data]))

                setProductionToAdd((current) => {
                    if (response.data.length === 0) {
                        return ''
                    }

                    if (response.data.some((production) => production.id === current)) {
                        return current
                    }

                    return response.data[0].id
                })
            } catch (loadError) {
                setProductionsError(loadError instanceof Error ? loadError.message : 'Failed to load productions.')
            } finally {
                setIsLoadingProductions(false)
            }
        }

        void fetchProductions()
    }, [productionSearchQuery])

    useEffect(() => {
        const missingIds = selectedProductionIds.filter((id) => !productions.some((production) => production.id === id))
        if (missingIds.length === 0) {
            return
        }

        let isActive = true

        const fetchMissingProductions = async () => {
            try {
                const responses = await Promise.all(
                    missingIds.map((id) => api.get<ProductionDetailResponse>(`/archive/productions/${id}`)),
                )

                if (!isActive) {
                    return
                }

                const fetched = responses.map((response) => response.data)
                setProductions((current) => mergeUniqueProductions([...current, ...fetched]))
            } catch (loadError) {
                if (isActive) {
                    setProductionsError(
                        loadError instanceof Error
                            ? loadError.message
                            : 'Failed to load linked productions.',
                    )
                }
            }
        }

        void fetchMissingProductions()

        return () => {
            isActive = false
        }
    }, [productions, selectedProductionIds])

    const selectedProductions = useMemo(
        () => productions.filter((production) => selectedProductionIds.includes(production.id)),
        [productions, selectedProductionIds],
    )

    const availableProductions = useMemo(
        () => productions.filter((production) => !selectedProductionIds.includes(production.id)),
        [productions, selectedProductionIds],
    )

    const setTab = (key: Locale) => {
        setLanguageTab(key)
    }

    // this function changes a certain field in a language 
    const changeFieldInLanguage = (field: keyof BlogContent['nl'], value: string) => {
        setForm((prev) => ({
            ...prev,
            [languageTab]: { ...prev[languageTab], [field]: value },
        }))
    }

    const changeTitle = (value: string) => {
        changeFieldInLanguage('title', value)
    }

    const changeContent = (value: string) => {
        changeFieldInLanguage('content', value)
    }

    const handleJsonChange = (value: unknown) => {
        setContentJson((current) => ({
            ...current,
            [languageTab]: value,
        }))
    }

    const back = () => {
        navigate('/admin')
    }

    const saveAsDraft = () => {
        // TODO: save as draft impl.
    }

    //TODO: navigate to blog page after succesfull publishing?
    const publish = async () => {
        // Combine all language versions into single JSON content
        const combinedContent = {
            nl: (contentJson.nl ?? form.nl.content) || null,
            en: (contentJson.en ?? form.en.content) || null,
        }

        const blogTitle = {
            nl: form.nl.title || null,
            en: form.en.title || null,
        }

        if (!form.nl.title && !form.en.title) {
            setError(messages.blogs.noTitleError)
            setSuccess('')
            return
        }

        setIsSaving(true)
        setError('')
        setSuccess('')

        try {
            const payload = {
                // TODO: would it be better to make blogTitle a json instead of string?
                title: JSON.stringify(blogTitle),
                content: combinedContent,
                productionIds: selectedProductionIds,
            }

            if (isEditMode && blogId) {
                const response = await apiFetch<{ data: { id: string } }>(`/archive/blogs/${blogId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                })
                setSuccess(`Blog updated successfully. ID: ${response.data.id}`)
            } else {
                const response = await api.post<{ data: { id: string } }>('/archive/blogs', payload)
                setSuccess(`Blog saved successfully. ID: ${response.data.id}`)
            }
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save blog.')
        } finally {
            setIsSaving(false)
        }
    }

    const addProduction = () => {
        if (!productionToAdd || selectedProductionIds.includes(productionToAdd)) {
            return
        }

        setSelectedProductionIds((current) => [...current, productionToAdd])
        const nextAvailable = availableProductions.find((production) => production.id !== productionToAdd)
        setProductionToAdd(nextAvailable?.id ?? '')
        setIsProductionPopupOpen(false)
    }

    const removeProduction = (productionId: string) => {
        setSelectedProductionIds((current) => current.filter((id) => id !== productionId))
        const firstAvailable = productions.find((p) => !selectedProductionIds.includes(p.id))
        if (firstAvailable && !productionToAdd) {
            setProductionToAdd(firstAvailable.id)
        }
    }

    const openProductionPopup = () => {
        if (!productionToAdd && availableProductions.length > 0) {
            setProductionToAdd(availableProductions[0].id)
        }
        setIsProductionPopupOpen(true)
    }

    const getProductionLabel = (production: ProductionItem) => {
        return production.title?.nl ?? production.title?.en ?? production.title?.fr ?? production.id
    }

    return (
        <>
            <PublicNavbar />
            <EditHeader
                backLabel={messages.editHeader.back}
                saveAsDraftLabel={messages.editHeader.saveOnDraft}
                publishLabel={messages.editHeader.publish}
                back={back}
                saveAsDraft={saveAsDraft}
                publish={publish}   
            />

            <SectionHeading
                title={isEditMode ? messages.blogs.editBlogTitle : messages.blogs.createBlogTitle}
                subTitle={isEditMode ? messages.blogs.editBlogDescription : messages.blogs.createBlogDescription}
            />

            {isLoadingBlog ? (
                <section className="px-8 py-4 text-sm text-muted">Loading blog data...</section>
            ) : null}

            {/* Language tabs for Dutch and English */}
            <BlogsTab language={languageTab} options={languageOptions} setTab={setTab} />
            {/* Content editor for selected language */}
            <BlogsTabContent
                key={languageTab}
                title={form[languageTab].title}
                content={form[languageTab].content}
                changeTitle={changeTitle}
                changeContent={changeContent}
                onJsonChange={handleJsonChange}
                titleLabel={messages.blogs.title}
                contentLabel={messages.blogs.content}
            />

            <ProductionManagementSection
                selectedProductions={selectedProductions}
                availableProductions={availableProductions}
                productionToAdd={productionToAdd}
                productionSearchQuery={productionSearchQuery}
                isProductionPopupOpen={isProductionPopupOpen}
                isLoadingProductions={isLoadingProductions}
                productionsError={productionsError}
                onOpenPopup={openProductionPopup}
                onClosePopup={() => setIsProductionPopupOpen(false)}
                onSelectProductionToAdd={setProductionToAdd}
                onProductionSearchQueryChange={setProductionSearchQuery}
                onAddProduction={addProduction}
                onRemoveProduction={removeProduction}
                getProductionLabel={getProductionLabel}
            />

            <section className="relative px-4 py-4 overflow-hidden">
                <div className="px-4 py-4 relative flex flex-col">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={publish}
                            disabled={isSaving || isLoadingBlog}
                            className="rounded-lg bg-[var(--color-accent)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (messages.blogs.savingButton) : (messages.editHeader.publish)}
                        </button>

                        {error ? <p className="text-sm text-red-500">{error}</p> : null}
                        {success ? <p className="text-sm text-green-600">{success}</p> : null}
                    </div>
                </div>
            </section>
        </>
    )
}



export default CreateBlogPage