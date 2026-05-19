import { useEffect, useMemo, useRef, useState } from 'react'
import { api, apiFetch } from '../../api/client'
import { getActiveLocale, getMessages, LOCALE_CHANGE_EVENT, setActiveLocale } from '../../i18n'

import { useNavigate, useParams } from 'react-router-dom'
import SectionHeading from '../../components/admin/SectionHeading'
import BlogsTab from '../../components/admin/BlogsTab'
import BlogsTabContent from '../../components/admin/BlogsTabContent'
import ProductionManagementSection, { type ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import { BlogBannerUploadSection } from '../../components/admin/blogs/BlogBannerUploadSection'
import type { ProductionPickerFilters } from '../../components/admin/blogs/ProductionPickerPopup'
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
import {getAdminRouteConfig} from "../../admin/paths.ts";
import {useOptionalAdminSession} from "../../auth/useAdminSessionContext.ts";

/*
With this page you can create or edit a blog, the blog will look like this:

{
    title: { nl: '' , en: ''},
    content: { nl: '', en: ''},
    productionIds: [],
    images: [],
    thumbnail_index: null
}

*/

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsDataURL(file)
    })
}

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
    const session = useOptionalAdminSession()
    const currentUser = session?.user

    const { id: blogId } = useParams<{ id: string }>()

    /*Edit mode if the blog already exists*/
    const isEditMode = Boolean(blogId)

    const [languageTab, setLanguageTab] = useState<Locale>(() => getActiveLocale(window.location.pathname))
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
    const [productionsToAdd, setProductionsToAdd] = useState<string[]>([])
    const [stagedProductionsToAdd, setStagedProductionsToAdd] = useState<ProductionItem[]>([])
    const [productionSearchQuery, setProductionSearchQuery] = useState('')
    const [productionPage, setProductionPage] = useState(1)
    const [hasMoreProductions, setHasMoreProductions] = useState(false)
    const [productionFilters, setProductionFilters] = useState<ProductionPickerFilters>({
        yearFrom: 1982,
        yearTo: new Date().getFullYear(),
        location: '',
    })
    const [isProductionPopupOpen, setIsProductionPopupOpen] = useState(false)
    const [isLoadingProductions, setIsLoadingProductions] = useState(false)
    const [productionsError, setProductionsError] = useState('')
    const isLoadingProductionsRef = useRef(false)

    const [blogImages, setBlogImages] = useState<string[]>([])
    const [thumbnailIndex, setThumbnailIndex] = useState<number | null>(null)
    const [pendingImages, setPendingImages] = useState<File[]>([])
    const [deletedBlogImageUrls, setDeletedBlogImageUrls] = useState<string[]>([])
    const [isUploadingImages, setIsUploadingImages] = useState(false)
    const initialBlogImagesRef = useRef<string[]>([])
    const [saveAction, setSaveAction] = useState<'publish' | 'draft' | null>(null)

    const navigate = useNavigate()
    const [locale, setLocale] = useState<Locale>(() => getActiveLocale(window.location.pathname))
    const messages = getMessages(locale)

    useEffect(() => {
        const syncLocale = () => {
            setLocale(getActiveLocale(window.location.pathname))
        }

        window.addEventListener(LOCALE_CHANGE_EVENT, syncLocale)

        return () => {
            window.removeEventListener(LOCALE_CHANGE_EVENT, syncLocale)
        }
    }, [])

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
            setDeletedBlogImageUrls([])
            initialBlogImagesRef.current = []
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
                setBlogImages(response.data.images ?? [])
                initialBlogImagesRef.current = response.data.images ?? []
                setThumbnailIndex(response.data.thumbnail_index ?? null)
                setDeletedBlogImageUrls([])
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
            isLoadingProductionsRef.current = true
            setIsLoadingProductions(true)
            setProductionsError('')

            try {
                const query = productionSearchQuery.trim()
                const location = productionFilters.location.trim()
                const params = new URLSearchParams({
                    page: String(productionPage),
                    limit: '100',
                    sort: query ? 'relevance' : 'recent',
                    lang: locale,
                    pastOnly: 'false',
                    draft: 'all',
                    yearFrom: String(productionFilters.yearFrom),
                    yearTo: String(productionFilters.yearTo),
                })

                if (query) {
                    params.set('search', query)
                }

                if (location) {
                    params.set('locations', location)
                }

                const endpoint = `/archive/productions?${params.toString()}`

                const response = await apiFetch<ProductionListResponse>(endpoint, {
                    signal: abortController.signal,
                })

                setProductions((current) => productionPage === 1
                    ? response.data
                    : mergeUniqueProductions([...current, ...response.data]))
                setHasMoreProductions((response.meta?.page ?? productionPage) < (response.meta?.totalPages ?? productionPage))
            } catch (loadError) {
                if (abortController.signal.aborted) {
                    return
                }

                setProductionsError(loadError instanceof Error ? loadError.message : 'Failed to load productions.')
            } finally {
                if (!abortController.signal.aborted) {
                    isLoadingProductionsRef.current = false
                    setIsLoadingProductions(false)
                }
            }
        }

        void fetchProductions()

        return () => {
            abortController.abort()
        }
    }, [productionFilters, productionSearchQuery, locale, productionPage])

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

    const pickerProductions = useMemo(
        () => mergeUniqueProductions([
            ...stagedProductionsToAdd.filter((production) => productionsToAdd.includes(production.id)),
            ...availableProductions,
        ]),
        [availableProductions, productionsToAdd, stagedProductionsToAdd],
    )

    const setTab = (key: Locale) => {
        setLanguageTab(key)
        setActiveLocale(key)
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

    const saveAsDraft = async () => {
        setIsSaving(true)
        setSaveAction('draft')
        setError('')
        setSuccess('')

        try {
            const combinedContent = {
                nl: (contentJson.nl ?? form.nl.content) || null,
                en: (contentJson.en ?? form.en.content) || null,
            }

            const blogTitle = {
                nl: form.nl.title || null,
                en: form.en.title || null,
            }

            let createdBlogId = blogId ?? ''
            let latestThumbnailIndex = thumbnailIndex

            // Delete removed images first (same as publish)
            if (isEditMode && blogId && deletedBlogImageUrls.length > 0) {
                const indicesToDelete = Array.from(
                    new Set(
                        deletedBlogImageUrls
                            .map((imageUrl) => initialBlogImagesRef.current.indexOf(imageUrl))
                            .filter((index) => index >= 0),
                    ),
                ).sort((left, right) => right - left)

                let latestImages = blogImages

                for (const imageIndex of indicesToDelete) {
                    const response = await apiFetch<{ data: { images: string[]; thumbnail_index: number | null } }>(
                        `/archive/blogs/${blogId}/images/${imageIndex}`,
                        { method: 'DELETE' },
                    )
                    latestImages = response.data.images ?? latestImages
                }

                setBlogImages(latestImages)
                setDeletedBlogImageUrls([])
            }

            // Create if new, patch if edit (same as publish)
            if (!isEditMode) {
                const response = await api.post<{ data: { id: string } }>('/archive/blogs', {
                    title: blogTitle,
                    content: combinedContent,
                    productionIds: selectedProductionIds,
                    draft: true,
                })
                createdBlogId = response.data.id
            }

            try {
                if (currentUser) {
                    await apiFetch(`/archive/blogs/${createdBlogId}/editors`, {
                        method: 'POST',
                        body: JSON.stringify({ editorId: currentUser.id }),
                    })
                }
            } catch (error) {
                if (!(error instanceof Error && error.message.includes('409'))) {
                    console.log(error)
                }
            }

            if (pendingImages.length > 0) {
                setIsUploadingImages(true)
                const filesPayload = await Promise.all(
                    pendingImages.map(async (file) => ({
                        file_name: file.name,
                        file_base64: await fileToBase64(file),
                    }))
                )

                try {
                    const imagesResponse = await apiFetch<{ data: { images: string[]; thumbnail_index: number | null } }>(
                        `/archive/blogs/${createdBlogId}/images`,
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                files: filesPayload,
                                thumbnail_index: thumbnailIndex,
                            }),
                        }
                    )
                    setBlogImages(imagesResponse.data.images ?? [])
                    latestThumbnailIndex = imagesResponse.data.thumbnail_index ?? latestThumbnailIndex
                    setPendingImages([])
                } catch (uploadError) {
                    setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload images.')
                } finally {
                    setIsUploadingImages(false)
                }
            }
            if (isEditMode && blogId) {
                const response = await apiFetch<{ data: { id: string } }>(`/archive/blogs/${blogId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        title: blogTitle,
                        content: combinedContent,
                        productionIds: selectedProductionIds,
                        draft: true,
                        thumbnail_index: latestThumbnailIndex,
                    }),
                })
                createdBlogId = response.data.id
            }

            navigate(`/admin/drafts/blogs`)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save draft.')
            setIsUploadingImages(false)
        } finally {
            setIsSaving(false)
            setSaveAction(null)
        }
    }


    const isLocaleFilled = (localeValue: Locale) => {
        const title = form[localeValue].title.trim()
        const htmlContent = form[localeValue].content
        const jsonContent = contentJson[localeValue]

        return title.length > 0 || hasTextContent(htmlContent) || hasRichContent(jsonContent)
    }

    const submitPublish = async () => {
        const { blogsPath } = getAdminRouteConfig(window.location.hostname)

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
        setSaveAction('publish')
        setError('')
        setSuccess('')

        try {
            let createdBlogId = blogId ?? ''
            let latestThumbnailIndex = thumbnailIndex

            if (isEditMode && blogId && deletedBlogImageUrls.length > 0) {
                const indicesToDelete = Array.from(
                    new Set(
                        deletedBlogImageUrls
                            .map((imageUrl) => initialBlogImagesRef.current.indexOf(imageUrl))
                            .filter((index) => index >= 0),
                    ),
                ).sort((left, right) => right - left)

                let latestImages = blogImages

                for (const imageIndex of indicesToDelete) {
                    const response = await apiFetch<{ data: { images: string[]; thumbnail_index: number | null } }>(
                        `/archive/blogs/${blogId}/images/${imageIndex}`,
                        {
                            method: 'DELETE',
                        },
                    )

                    latestImages = response.data.images ?? latestImages
                }

                setBlogImages(latestImages)
                setDeletedBlogImageUrls([])
            }

            if (!isEditMode) {
                const response = await api.post<{ data: { id: string } }>('/archive/blogs', {
                    title: blogTitle,
                    content: combinedContent,
                    productionIds: selectedProductionIds,
                })
                createdBlogId = response.data.id
            }

            try {
                if (currentUser) {
                    await apiFetch(`/archive/blogs/${createdBlogId}/editors`, {
                        method: 'POST',
                        body: JSON.stringify({
                            editorId: currentUser.id,
                        }),
                    })
                }

            } catch (error) {
                // Ignore "editor already linked"
                if (
                    error instanceof Error &&
                    error.message.includes('409')
                ) {
                    // do nothing
                } else {
                    console.log(error)
                }
            }

            // Upload images if there are any pending
            if (pendingImages.length > 0) {
                setIsUploadingImages(true)
                const filesPayload = await Promise.all(
                    pendingImages.map(async (file) => ({
                        file_name: file.name,
                        file_base64: await fileToBase64(file),
                    }))
                )

                try {
                    const imagesResponse = await apiFetch<{ data: { images: string[]; thumbnail_index: number | null } }>(
                        `/archive/blogs/${createdBlogId}/images`,
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                files: filesPayload,
                                thumbnail_index: thumbnailIndex,
                            }),
                        }
                    )

                    setBlogImages(imagesResponse.data.images ?? [])
                    latestThumbnailIndex = imagesResponse.data.thumbnail_index ?? latestThumbnailIndex
                    setPendingImages([])
                } catch (uploadError) {
                    // Try to roll back the created blog to avoid duplicates on retry
                    try {
                        if (!isEditMode && createdBlogId) {
                            await apiFetch(`/archive/blogs/${createdBlogId}`, { method: 'DELETE' })
                        }
                        setError(
                            messages.blogs.bannerUpload.uploadFailedRemoved(
                                uploadError instanceof Error ? uploadError.message : ''
                            )
                        )
                    } catch {
                        // Could not roll back — surface edit URL so user can retry there
                        if (!isEditMode) {
                            const editUrl = `/${locale}/admin/blogs/${createdBlogId}/edit`
                            setError(
                                messages.blogs.bannerUpload.uploadFailedCreatedEditUrl(
                                    uploadError instanceof Error ? uploadError.message : '',
                                    editUrl
                                )
                            )
                        } else {
                            setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload images.')
                        }
                    }
                } finally {
                    setIsUploadingImages(false)
                }
            }

            if (isEditMode && blogId) {
                const response = await apiFetch<{ data: { id: string } }>(`/archive/blogs/${blogId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        title: blogTitle,
                        content: combinedContent,
                        productionIds: selectedProductionIds,
                        thumbnail_index: latestThumbnailIndex,
                        draft: false,
                    }),
                })
                createdBlogId = response.data.id
            }

            navigate(blogsPath)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Failed to save blog.')
            setIsUploadingImages(false)
        } finally {
            setIsSaving(false)
            setSaveAction(null)
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

    const addProduction = (productionIds: string[]) => {
        const productionIdsToAdd = productionIds.filter((id) => !selectedProductionIds.includes(id))
        if (productionIdsToAdd.length === 0) {
            return
        }

        setSelectedProductionIds((current) => [...current, ...productionIdsToAdd])
        setStagedProductionsToAdd([])
        setProductionsToAdd([])
        setIsProductionPopupOpen(false)
    }

    const removeProduction = (productionId: string) => {
        setSelectedProductionIds((current) => current.filter((id) => id !== productionId))
    }

    const changeProductionSearchQuery = (query: string) => {
        isLoadingProductionsRef.current = false
        setProductionSearchQuery(query)
        setProductionPage(1)
        setHasMoreProductions(false)
    }

    const changeProductionFilters = (filters: ProductionPickerFilters) => {
        isLoadingProductionsRef.current = false
        setProductionFilters(filters)
        setProductionPage(1)
        setHasMoreProductions(false)
    }

    const loadMoreProductions = () => {
        if (isLoadingProductionsRef.current || !hasMoreProductions) {
            return
        }

        isLoadingProductionsRef.current = true
        setProductionPage((current) => current + 1)
    }

    const openProductionPopup = () => {
        setStagedProductionsToAdd([])
        setProductionsToAdd([])
        setIsProductionPopupOpen(true)
    }

    const handleDeleteImage = (index: number) => {
        if (!isEditMode || !blogId) {
            setBlogImages((current) => current.filter((_, i) => i !== index))
            // If the deleted image was the thumbnail, reset thumbnail to null
            if (thumbnailIndex === index) {
                setThumbnailIndex(null)
            }
            // If there are images after the deleted one, adjust their indices
            else if (thumbnailIndex !== null && thumbnailIndex > index) {
                setThumbnailIndex(thumbnailIndex - 1)
            }
            return
        }

        const imageToDelete = blogImages[index]
        if (typeof imageToDelete === 'undefined') {
            return
        }

        setDeletedBlogImageUrls((current) => (current.includes(imageToDelete) ? current : [...current, imageToDelete]))
        setBlogImages((current) => current.filter((_, i) => i !== index))

        // If the deleted image was the thumbnail, reset thumbnail to null
        if (thumbnailIndex === index) {
            setThumbnailIndex(null)
        }
        // If there are images after the deleted one, adjust their indices
        else if (thumbnailIndex !== null && thumbnailIndex > index) {
            setThumbnailIndex(thumbnailIndex - 1)
        }

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
                key={`${languageTab}-${locale}`}
                title={form[languageTab].title}
                content={form[languageTab].content}
                changeTitle={changeTitle}
                changeContent={changeContent}
                onJsonChange={handleJsonChange}
                titleLabel={messages.blogs.title}
                contentLabel={messages.blogs.content}
                quillPlaceholder={messages.blogs.placeholder}
            />

            <ProductionManagementSection
                selectedProductions={selectedProductions}
                availableProductions={pickerProductions}
                productionsToAdd={productionsToAdd}
                productionSearchQuery={productionSearchQuery}
                productionFilters={productionFilters}
                isProductionPopupOpen={isProductionPopupOpen}
                isLoadingProductions={isLoadingProductions}
                hasMoreProductions={hasMoreProductions}
                productionsError={productionsError}
                onOpenPopup={openProductionPopup}
                onClosePopup={() => setIsProductionPopupOpen(false)}
                onSelectProductionsToAdd={(productionIds) => {
                    setStagedProductionsToAdd((current) => mergeUniqueProductions([
                        ...current,
                        ...availableProductions.filter((production) => productionIds.includes(production.id)),
                    ]))
                    setProductionsToAdd(productionIds)
                }}
                onProductionSearchQueryChange={changeProductionSearchQuery}
                onProductionFiltersChange={changeProductionFilters}
                onLoadMoreProductions={loadMoreProductions}
                onAddProduction={addProduction}
                onRemoveProduction={removeProduction}
            />

            <section className="relative px-4 py-4 overflow-hidden">
                <div className="px-4 py-4 relative flex flex-col">
                    <div className="min-w-0 max-w-full rounded-xl border border-border bg-background">
                        <div className="bg-surface rounded-xl p-4">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">{messages.blogs.bannerUpload.title}</h2>
                            <p className="mb-4 text-sm text-muted">{messages.blogs.bannerUpload.subtitle}</p>
                            <BlogBannerUploadSection
                                images={blogImages}
                                thumbnailIndex={thumbnailIndex}
                                onThumbnailIndexChange={setThumbnailIndex}
                                onPendingFilesChange={setPendingImages}
                                onDeleteImage={handleDeleteImage}
                                isUploading={isUploadingImages}
                                messages={messages}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative px-4 py-4 overflow-hidden">
                <div className="px-4 py-4 relative flex flex-col">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={publish}
                            disabled={isSaving || isLoadingBlog || isDeleting}
                            className="rounded-full bg-accent px-6 py-3 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving && saveAction === 'publish' ? (messages.blogs.savingButton) : (messages.editHeader.publish)}
                        </button>

                        <button
                            type="button"
                            onClick={saveAsDraft}
                            disabled={isSaving || isLoadingBlog || isDeleting}
                            className="rounded-full bg-accent px-6 py-3 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving && saveAction === 'draft' ? (messages.blogs.savingDraftButton) : (messages.editHeader.saveOnDraft)}
                        </button>

                        {isEditMode ? (
                            <button
                                type="button"
                                onClick={removeBlog}
                                disabled={isSaving || isLoadingBlog || isDeleting}
                                className="rounded-full bg-accent px-6 py-3 text-sm font-regular tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
