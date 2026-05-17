import { useEffect, useMemo, useState } from 'react'
import { api, apiFetch } from '../../api/client'
import { getActiveLocale, getMessages} from '../../i18n'

import { useNavigate, useParams } from 'react-router-dom'
import SectionHeading from '../../components/admin/SectionHeading'
import BlogsTab from '../../components/admin/BlogsTab'
import BlogsTabContent from '../../components/admin/BlogsTabContent'
import ProductionManagementSection, { type ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import {
    formatBlogDetailForForm,
    validateBlogPublishInput,
    type BlogDetailResponse,
    type ProductionDetailResponse,
    type ProductionListResponse,
} from './createBlogPage.formatters'

import type { Language, BlogContent } from '../../types/blog'
import type { Locale } from '../../i18n/types'

import AdminLayout from '../../components/admin/AdminLayout'


/*
With this page you can create or edit a blog, the blog will look like this:

{
    title: { nl: '' , en: ''},
    content: { nl: '', en: ''},
    productionIds: []
}

*/

function mergeUniqueProductions(productionList: ProductionItem[]): ProductionItem[] {
    const byId = new Map<string, ProductionItem>()

    for (const production of productionList) {
        byId.set(production.id, production)
    }

    return Array.from(byId.values())
}

function isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false
    }

    return /not found|404/i.test(error.message)
}

function hasTextContent(value: string): boolean {
    const stripped = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()
    return stripped.length > 0
}

function hasRichContent(value: unknown): boolean {
    if (!value) {
        return false
    }

    if (typeof value === 'string') {
        return hasTextContent(value)
    }

    if (typeof value === 'object' && value !== null && 'ops' in value && Array.isArray((value as { ops?: unknown[] }).ops)) {
        return (value as { ops: unknown[] }).ops.some((op) => {
            if (typeof op !== 'object' || op === null || !('insert' in op)) {
                return false
            }

            const insert = (op as { insert?: unknown }).insert

            if (typeof insert === 'string') {
                return insert.trim().length > 0
            }

            return Boolean(insert)
        })
    }

    return true
}

// default value of form
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
    const [isDeleting, setIsDeleting] = useState(false)
    const [isBlogNotFound, setIsBlogNotFound] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false)
    const [publishConfirmMessage, setPublishConfirmMessage] = useState('')

    const [productions, setProductions] = useState<ProductionItem[]>([])
    const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([])
    const [productionToAdd, setProductionToAdd] = useState('')
    const [productionSearchQuery, setProductionSearchQuery] = useState('')
    const [isProductionPopupOpen, setIsProductionPopupOpen] = useState(false)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
    const [productionsError, setProductionsError] = useState('')

    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages(locale)

    const languageOptions: { key: Language; label: string }[] = [
        { key: 'nl', label: messages.blogs.dutchOption },
        { key: 'en', label: messages.blogs.englishOption },
    ]

    useEffect(() => {
        if (!isEditMode || !blogId) {
            setForm(defaultForm)
            setContentJson({ nl: null, en: null })
            setSelectedProductionIds([])
            setIsBlogNotFound(false)
            return
        }

        let isActive = true

        const loadBlog = async () => {
            setIsLoadingBlog(true)
            setIsBlogNotFound(false)
            setError('')

            try {
                const response = await api.get<BlogDetailResponse>(`/archive/blogs/${blogId}`)
                if (!isActive) {
                    return
                }

                const { form: formattedForm, contentJson: formattedContentJson } = formatBlogDetailForForm(response.data)
                setForm(formattedForm)
                setContentJson(formattedContentJson)

                setSelectedProductionIds(response.data.productions ?? [])
            } catch (loadError) {
                if (isActive) {
                    if (isNotFoundError(loadError)) {
                        setIsBlogNotFound(true)
                        setError('')
                        return
                    }

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
        const abortController = new AbortController()

        const fetchProductions = async () => {
            setIsLoadingProductions(true)
            setProductionsError('')

            try {
                const query = productionSearchQuery.trim()
                const params = new URLSearchParams({
                    page: '1',
                    limit: '100',
                    sort: 'relevance',
                    lang: locale,
                })

                if (query) {
                    params.set('search', query)
                }

                const endpoint = `/archive/productions?${params.toString()}`

                const response = await apiFetch<ProductionListResponse>(endpoint, {
                    signal: abortController.signal,
                })

                setProductions(mergeUniqueProductions(response.data))

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
                if (abortController.signal.aborted) {
                    return
                }

                setProductionsError(loadError instanceof Error ? loadError.message : 'Failed to load productions.')
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoadingProductions(false)
                }
            }
        }

        void fetchProductions()

        return () => {
            abortController.abort()
        }
    }, [productionSearchQuery, locale])

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

    const saveAsDraft = () => {
        // TODO: save as draft impl.
    }

    const isLocaleFilled = (localeValue: Locale) => {
        const title = form[localeValue].title.trim()
        const htmlContent = form[localeValue].content
        const jsonContent = contentJson[localeValue]

        return title.length > 0 || hasTextContent(htmlContent) || hasRichContent(jsonContent)
    }

    const submitPublish = async () => {
        // Combine all language versions into single JSON content
        const combinedContent = {
            nl: (contentJson.nl ?? form.nl.content) || null,
            en: (contentJson.en ?? form.en.content) || null,
        }

        console.log(combinedContent);
        

        const blogTitle = {
            nl: form.nl.title || null,
            en: form.en.title || null,
        }

        setIsSaving(true)
        setError('')
        setSuccess('')

        try {
            const payload = {
                title: blogTitle,
                content: combinedContent,
                productionIds: selectedProductionIds,
            }

            if (isEditMode && blogId) {
                const response = await apiFetch<{ data: { id: string } }>(`/archive/blogs/${blogId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                })
                navigate(`/blogs/${response.data.id}`)
            } else {
                const response = await api.post<{ data: { id: string } }>('/archive/blogs', payload)
                navigate(`/blogs/${response.data.id}`)
            }
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save blog.')
        } finally {
            setIsSaving(false)
        }
    }


    // pop up for confirming pop
    const requestPublish = () => {
        const validation = validateBlogPublishInput(form, contentJson)

        if (validation === 'atLeastOneLanguageRequired') {
            setError(messages.blogs.noTitleError)
            setSuccess('')
            return
        }

        if (validation === 'filledLanguageNeedsTitle') {
            setError(messages.blogs.filledLanguageNeedsTitleError)
            setSuccess('')
            return
        }

        if (validation === 'filledLanguageNeedsContent') {
            setError(messages.blogs.filledLanguageNeedsContentError)
            setSuccess('')
            return
        }

        if (validation === 'notAllLanguageFilled') {
            const missingLanguageMessage = isLocaleFilled('nl')
                ? messages.blogs.publishConfirmWithoutEnglish
                : messages.blogs.publishConfirmWithoutDutch

            setPublishConfirmMessage(missingLanguageMessage)
            setIsPublishConfirmOpen(true)
            setError('')
            setSuccess('')
            return
        }

        void submitPublish()
    }

    const confirmPublish = () => {
        setIsPublishConfirmOpen(false)
        void submitPublish()
    }

    const cancelPublishConfirmation = () => {
        setIsPublishConfirmOpen(false)
    }

    const removeBlog = async () => {
        if (!isEditMode || !blogId) {
            return
        }

        const shouldDelete = window.confirm(messages.blogs.deleteConfirm)
        if (!shouldDelete) {
            return
        }

        setIsDeleting(true)
        setError('')
        setSuccess('')

        try {
            await api.delete<unknown>(`/archive/blogs/${blogId}`)
            navigate('/admin/dashboard')
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : messages.blogs.deleteError)
        } finally {
            setIsDeleting(false)
        }
    }

    //TODO: navigate to blog page after succesfull publishing?
    const publish = async () => {
        requestPublish()
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


    if (isEditMode && isBlogNotFound) {
        return (
            <>
                <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName="Artevelde stagiair" showSidebar>
                    <section className="px-8 py-8">
                        <p className="text-base text-foreground">{messages.blogs.blogNotFound}</p>
                    </section>
                </AdminLayout>
            </>
        )
    }

    return (
        <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName="Artevelde stagiair" showSidebar>

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
            />

            <section className="relative px-4 py-4 overflow-hidden">
                <div className="px-4 py-4 relative flex flex-col">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={publish}
                            disabled={isSaving || isLoadingBlog || isDeleting}
                            className="rounded-full bg-accent px-6 py-3 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (messages.blogs.savingButton) : (messages.editHeader.publish)}
                        </button>

                        <button
                            type="button"
                            onClick={saveAsDraft}
                            disabled={isSaving || isLoadingBlog || isDeleting}
                            className="rounded-full bg-accent px-6 py-3 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (messages.blogs.savingButton) : (messages.editHeader.saveOnDraft)}
                        </button>

                        {isEditMode ? (
                            <button
                                type="button"
                                onClick={removeBlog}
                                disabled={isSaving || isLoadingBlog || isDeleting}
                                className="rounded-full bg-accent px-4 py-2 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDeleting ? messages.blogs.deletingButton : messages.blogs.deleteButton}
                            </button>
                        ) : null}

                        {error ? <p className="text-sm text-red-500">{error}</p> : null}
                        {success ? <p className="text-sm text-green-600">{success}</p> : null}
                    </div>
                </div>
            </section>

            {isPublishConfirmOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={messages.blogs.publishConfirmTitle}
                    onClick={cancelPublishConfirmation}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold tracking-wide text-foreground">
                            {messages.blogs.publishConfirmTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-muted">
                            {publishConfirmMessage}
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelPublishConfirmation}
                                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-surface"
                            >
                                {messages.blogs.publishConfirmCancel}
                            </button>
                            <button
                                type="button"
                                onClick={confirmPublish}
                                disabled={isSaving}
                                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {messages.blogs.publishConfirmProceed}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    )
}



export default CreateBlogPage
