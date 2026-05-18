import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { apiFetch, normalizeApiAssetUrl } from '../../api/client'
import ProductionManagementSection, { type ProductionItem as ManagedProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import type { ProductionPickerFilters } from '../../components/admin/blogs/ProductionPickerPopup'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import { getActiveLocale } from '../../i18n'

type ProductionItem = ManagedProductionItem

type PosterItem = {
  id: string
  title: string
  file_url: string
  mime_type: string | null
  files?: Array<{
    id: string
    file_url: string
    mime_type: string | null
  }>
  created_at: string
  production: {
    id: string
    title: string
  } | null
  productions?: Array<{
    id: string
    title: string
  }>
}

type PaginatedApiResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

type ProductionDetailResponse = {
  data: ProductionItem
}

function mergeUniqueProductions(productionList: ProductionItem[]): ProductionItem[] {
  const byId = new Map<string, ProductionItem>()

  for (const production of productionList) {
    byId.set(production.id, production)
  }

  return Array.from(byId.values())
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function getPdfPreviewUrl(fileUrl: string): string {
  const normalized = normalizeApiAssetUrl(fileUrl) ?? fileUrl
  const hash = '#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0'
  return normalized.includes('#') ? normalized : `${normalized}${hash}`
}

const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])

function PostersPageContent() {
  const i18n = useAdminMessages()
  const locale = getActiveLocale(window.location.pathname)
  const [posters, setPosters] = useState<PosterItem[]>([])
  const [productions, setProductions] = useState<ProductionItem[]>([])
  const [title, setTitle] = useState('')
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
  const isLoadingProductionsRef = useRef(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingPosterId, setDeletingPosterId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productionError, setProductionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pageTitle = i18n.admin.posters.pageTitle
  const loadPostersErrorMessage = i18n.admin.posters.loadPostersError
  const loadProductionsErrorMessage = i18n.admin.posters.loadProductionsError

  const selectedProductions = useMemo(
    () => productions.filter((p) => selectedProductionIds.includes(p.id)),
    [productions, selectedProductionIds],
  )

  const availableProductions = useMemo(
    () => productions.filter((p) => !selectedProductionIds.includes(p.id)),
    [productions, selectedProductionIds],
  )

  const pickerProductions = useMemo(
    () => mergeUniqueProductions([
      ...stagedProductionsToAdd.filter((production) => productionsToAdd.includes(production.id)),
      ...availableProductions,
    ]),
    [availableProductions, productionsToAdd, stagedProductionsToAdd],
  )

  const fetchProductionsWithFallback = useCallback(async (searchQuery: string = '', filters: ProductionPickerFilters, page = 1) => {
    const trimmedSearchQuery = searchQuery.trim()
    const trimmedLocation = filters.location.trim()
    const params = new URLSearchParams({
      page: String(page),
      limit: '100',
      sort: trimmedSearchQuery ? 'relevance' : 'recent',
      lang: locale,
      pastOnly: 'false',
      yearFrom: String(filters.yearFrom),
      yearTo: String(filters.yearTo),
    })

    if (trimmedSearchQuery) {
      params.set('search', trimmedSearchQuery)
    }

    if (trimmedLocation) {
      params.set('locations', trimmedLocation)
    }

    return apiFetch<PaginatedApiResponse<ProductionItem>>(`/archive/productions?${params.toString()}`)
  }, [locale])

  const loadData = useCallback(async (searchQuery: string = '') => {
    setIsLoading(true)
    setError(null)

    const postersResult = await Promise.allSettled([
      apiFetch<PaginatedApiResponse<PosterItem>>(`/archive/posters?page=1&limit=80${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`),
    ])

    const [resolvedPosters] = postersResult

    if (resolvedPosters.status === 'fulfilled') {
      setPosters(resolvedPosters.value.data)
    } else {
      setPosters([])
    }

    const postersError = resolvedPosters.status === 'rejected'
      ? resolvedPosters.reason instanceof Error
        ? resolvedPosters.reason.message
        : loadPostersErrorMessage
      : null

    if (postersError) {
      setError(postersError)
    }

    setIsLoading(false)
  }, [loadPostersErrorMessage])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const abortController = new AbortController()

    const loadProductions = async () => {
      isLoadingProductionsRef.current = true
      setIsLoadingProductions(true)
      setProductionError(null)

      try {
        const response = await fetchProductionsWithFallback(productionSearchQuery, productionFilters, productionPage)

        if (abortController.signal.aborted) {
          return
        }

        setProductions((current) => productionPage === 1
          ? response.data
          : mergeUniqueProductions([...current, ...response.data]))
        setHasMoreProductions((response.meta?.page ?? productionPage) < (response.meta?.totalPages ?? productionPage))
      } catch (requestError) {
        if (!abortController.signal.aborted) {
          setProductionError(requestError instanceof Error ? requestError.message : loadProductionsErrorMessage)
        }
      } finally {
        if (!abortController.signal.aborted) {
          isLoadingProductionsRef.current = false
          setIsLoadingProductions(false)
        }
      }
    }

    void loadProductions()

    return () => {
      abortController.abort()
    }
  }, [fetchProductionsWithFallback, loadProductionsErrorMessage, productionFilters, productionSearchQuery, productionPage])

  useEffect(() => {
    const missingIds = selectedProductionIds.filter((id) => !productions.some((production) => production.id === id))
    if (missingIds.length === 0) {
      return
    }

    let isActive = true

    const fetchMissingProductions = async () => {
      try {
        const responses = await Promise.all(
          missingIds.map((id) => apiFetch<ProductionDetailResponse>(`/archive/productions/${id}`)),
        )

        if (!isActive) {
          return
        }

        const fetched = responses.map((response) => response.data)
        setProductions((current) => mergeUniqueProductions([...current, ...fetched]))
      } catch (requestError) {
        if (isActive) {
          setProductionError(requestError instanceof Error ? requestError.message : loadProductionsErrorMessage)
        }
      }
    }

    void fetchMissingProductions()

    return () => {
      isActive = false
    }
  }, [loadProductionsErrorMessage, productions, selectedProductionIds])

  const openProductionPopup = () => {
    setStagedProductionsToAdd([])
    setProductionsToAdd([])
    setIsProductionPopupOpen(true)
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

  const removeProduction = (id: string) => {
    setSelectedProductionIds((current) => current.filter((pid) => pid !== id))
  }

  const handleCreatePoster = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim()) {
      setError(i18n.admin.posters.validationTitleRequired)
      return
    }

    if (selectedFiles.length === 0) {
      setError(i18n.admin.posters.validationFileRequired)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const filesPayload = await Promise.all(
        selectedFiles.map(async (file) => ({
          file_name: file.name,
          mime_type: file.type || 'image/jpeg',
          file_base64: await fileToBase64(file),
        })),
      )

      await apiFetch('/archive/posters', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          production_ids: selectedProductionIds,
          files: filesPayload,
        }),
      })

      setTitle('')
      setSelectedFiles([])
      setSelectedProductionIds([])
      setProductionSearchQuery('')
      setStagedProductionsToAdd([])
      setProductionsToAdd([])
      setIsProductionPopupOpen(false)
      await loadData(search)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : i18n.admin.posters.loadPostersError
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePoster = async (posterId: string) => {
    const shouldDelete = window.confirm(i18n.admin.posters.deleteConfirm)
    if (!shouldDelete) {
      return
    }

    setDeletingPosterId(posterId)
    setError(null)

    try {
      await apiFetch(`/archive/posters/${posterId}`, {
        method: 'DELETE',
      })

      setPosters((currentPosters) => currentPosters.filter((poster) => poster.id !== posterId))
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : i18n.admin.posters.deleteError
      setError(message)
    } finally {
      setDeletingPosterId(null)
    }
  }

  return (
    <section className="site-container max-w-6xl space-y-6">
      <div className="border-1 border-[var(--color-admin-card-border)] rounded-[1rem] bg-surface px-8 py-8 max-[640px]:px-5 max-[640px]:py-6">
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">{pageTitle}</h1>
        <p className="mt-2 text-sm text-muted">{i18n.admin.posters.pageSubtitle}</p>
      </div>

      <form
        className="rounded-[1rem] border border-[var(--color-admin-card-border)] bg-white p-6 dark:bg-[#111318]"
        onSubmit={handleCreatePoster}
      >
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span>{i18n.admin.posters.formTitleLabel}</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 rounded-md border border-[var(--color-admin-card-border)] px-3"
              placeholder={i18n.admin.posters.formTitleLabel}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span>{i18n.admin.posters.formFileLabel}</span>
            <div className="space-y-3">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(event) => {
                    const nextFiles = Array.from(event.target.files ?? [])
                    const acceptedFiles = nextFiles.filter((file) => ALLOWED_UPLOAD_TYPES.has(file.type))
                    const rejectedFiles = nextFiles.filter((file) => !ALLOWED_UPLOAD_TYPES.has(file.type))

                    if (rejectedFiles.length > 0) {
                      const rejectedNames = rejectedFiles.map((file) => file.name).join(', ')
                      setError(`${i18n.admin.posters.validationInvalidFileType}: ${rejectedNames}`)
                    } else {
                      setError(null)
                    }

                    // Accumulate files instead of replacing; keep first occurrence by name+size+mtime.
                    setSelectedFiles((currentFiles) => {
                      const existingKeys = new Set(
                        currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
                      )
                      const uniqueAccepted = acceptedFiles.filter((file) => {
                        const key = `${file.name}-${file.size}-${file.lastModified}`
                        return !existingKeys.has(key)
                      })

                      return [...currentFiles, ...uniqueAccepted]
                    })
                    
                    // Reset the input so the same file can be selected again
                    event.target.value = ''
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
                >
                  <span>+</span>
                  <span>{i18n.admin.posters.addFileButton}</span>
                </button>
              </div>

              {selectedFiles.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedFiles.map((file, index) => (
                    <button
                      key={`${file.name}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedFiles((currentFiles) =>
                          currentFiles.filter((_, i) => i !== index),
                        )
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent"
                      aria-label={`Remove file ${file.name}`}
                    >
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <span className="text-sm leading-none">×</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="text-xs text-muted">{i18n.admin.posters.formFileHint}</p>
              {selectedFiles.length > 0 ? (
                <p className="text-xs text-muted">{i18n.admin.posters.filesSelectedCount(selectedFiles.length)}</p>
              ) : null}
            </div>
          </label>

          <ProductionManagementSection
            compact
            selectedProductions={selectedProductions}
            availableProductions={pickerProductions}
            productionsToAdd={productionsToAdd}
            productionSearchQuery={productionSearchQuery}
            productionFilters={productionFilters}
            isProductionPopupOpen={isProductionPopupOpen}
            isLoadingProductions={isLoadingProductions}
            hasMoreProductions={hasMoreProductions}
            productionsError={productionError ?? ''}
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
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? i18n.admin.posters.submittingButton : i18n.admin.posters.submitButton}
          </button>
        </div>
      </form>

      <div className="rounded-[1rem] border border-[var(--color-admin-card-border)] bg-white p-6 dark:bg-[#111318]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl text-foreground">{i18n.admin.posters.overviewHeading}</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={i18n.admin.posters.searchPlaceholder}
              className="h-10 rounded-full border border-[var(--color-admin-card-border)] px-4 text-sm"
            />
            <button
              type="button"
              className="h-10 rounded-full border border-[var(--color-admin-card-border)] px-4 text-sm"
              onClick={() => {
                void loadData(search)
              }}
            >
              {i18n.admin.posters.searchButton}
            </button>
          </div>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {isLoading ? (
          <p className="text-sm text-muted">{i18n.admin.posters.loadingMessage}</p>
        ) : posters.length === 0 ? (
          <p className="text-sm text-muted">{i18n.admin.posters.emptyMessage}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posters.map((poster) => (
              <article key={poster.id} className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-admin-card-border)]">
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  {poster.mime_type === 'application/pdf' ? (
                    <iframe
                      src={getPdfPreviewUrl(poster.file_url)}
                      title={i18n.admin.posters.pdfPreviewTitle(poster.title)}
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src={normalizeApiAssetUrl(poster.file_url)}
                      alt={poster.title}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="flex flex-col grow p-3">
                  <div className="space-y-1">
                    <h3 className="line-clamp-2 text-base font-medium text-foreground">{poster.title}</h3>
                    <p className="text-xs text-muted">
                      {(poster.productions?.map((production) => production.title).join(' • ') || poster.production?.title) ?? i18n.admin.posters.noProductionAssigned}
                    </p>
                    <p className="text-xs text-muted">{i18n.admin.posters.filesCountLabel(poster.files?.length ?? 1)}</p>
                    <p className="text-xs text-muted">{new Date(poster.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'nl-BE')}</p>
                  </div>
                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeletePoster(poster.id)
                      }}
                      disabled={deletingPosterId === poster.id}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      {deletingPosterId === poster.id ? i18n.admin.posters.deletingButton : i18n.admin.posters.deleteButton}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PostersPage() {
  return (
    <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" showSidebar>
      <PostersPageContent />
    </AdminLayout>
  )
}

export default PostersPage
