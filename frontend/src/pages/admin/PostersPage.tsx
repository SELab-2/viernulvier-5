import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { apiFetch, normalizeApiAssetUrl } from '../../api/client'
import ProductionManagementSection, { type ProductionItem as ManagedProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'

type LocalizedText = {
  nl?: string
  en?: string
  fr?: string
} | null

type ProductionItem = ManagedProductionItem

type PosterItem = {
  id: string
  title: string
  file_url: string
  mime_type: string | null
  created_at: string
  production: {
    id: string
    title: string
  } | null
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function getLocalizedTitle(value: LocalizedText): string {
  if (!value) {
    return ''
  }

  const candidates = [value.nl, value.en, value.fr]
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0)?.trim() ?? ''
}

function getPdfPreviewUrl(fileUrl: string): string {
  const normalized = normalizeApiAssetUrl(fileUrl) ?? fileUrl
  const hash = '#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0'
  return normalized.includes('#') ? normalized : `${normalized}${hash}`
}

function PostersPageContent() {
  const i18n = useAdminMessages()
  const [posters, setPosters] = useState<PosterItem[]>([])
  const [productions, setProductions] = useState<ProductionItem[]>([])
  const [title, setTitle] = useState('')
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([])
  const [productionToAdd, setProductionToAdd] = useState('')
  const [productionSearchQuery, setProductionSearchQuery] = useState('')
  const [isProductionPopupOpen, setIsProductionPopupOpen] = useState(false)
  const [isLoadingProductions] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingPosterId, setDeletingPosterId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productionError, setProductionError] = useState<string | null>(null)

  const pageTitle = i18n.admin.posters.pageTitle
  const loadPostersErrorMessage = i18n.admin.posters.loadPostersError
  const loadProductionsErrorMessage = i18n.admin.posters.loadProductionsError

  const sortedProductions = useMemo(() => {
    return [...productions].sort((a, b) => {
      const first = getLocalizedTitle(a.title)
      const second = getLocalizedTitle(b.title)
      return first.localeCompare(second, 'nl-BE', { sensitivity: 'base' })
    })
  }, [productions])

  const selectedProductions = useMemo(
    () => sortedProductions.filter((p) => selectedProductionIds.includes(p.id)),
    [sortedProductions, selectedProductionIds],
  )

  const availableProductions = useMemo(
    () => sortedProductions.filter((p) => !selectedProductionIds.includes(p.id)),
    [sortedProductions, selectedProductionIds],
  )

  const fetchProductionsWithFallback = useCallback(async () => {
    const urls = [
      '/archive/productions?page=1&limit=100&sort=recent',
      '/archive/productions?page=1&limit=100',
      '/archive/productions?page=1&limit=100&lang=nl',
    ]

    let lastError: unknown = null

    for (const url of urls) {
      try {
        const response = await apiFetch<PaginatedApiResponse<ProductionItem>>(url)
        return response.data
      } catch (requestError) {
        lastError = requestError
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Could not load productions')
  }, [])

  const loadData = useCallback(async (searchQuery: string = '') => {
    setIsLoading(true)
    setError(null)
    setProductionError(null)

    const [postersResult, productionsResult] = await Promise.allSettled([
      apiFetch<PaginatedApiResponse<PosterItem>>(`/archive/posters?page=1&limit=80${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`),
      fetchProductionsWithFallback(),
    ])

    if (postersResult.status === 'fulfilled') {
      setPosters(postersResult.value.data)
    } else {
      setPosters([])
    }

    if (productionsResult.status === 'fulfilled') {
      setProductions(productionsResult.value)
    } else {
      setProductions([])
    }

    const postersError = postersResult.status === 'rejected'
      ? postersResult.reason instanceof Error
        ? postersResult.reason.message
        : loadPostersErrorMessage
      : null

    const productionsError = productionsResult.status === 'rejected'
      ? productionsResult.reason instanceof Error
        ? productionsResult.reason.message
        : loadProductionsErrorMessage
      : null

    if (productionsError || postersError) {
      setError(productionsError ?? postersError)
    }

    if (productionsError) {
      setProductionError(productionsError)
    }

    setIsLoading(false)
  }, [fetchProductionsWithFallback, loadPostersErrorMessage, loadProductionsErrorMessage])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openProductionPopup = () => {
    if (!productionToAdd && availableProductions.length > 0) {
      setProductionToAdd(availableProductions[0].id)
    }
    setIsProductionPopupOpen(true)
  }

  const addProduction = () => {
    if (!productionToAdd || selectedProductionIds.includes(productionToAdd)) {
      return
    }
    setSelectedProductionIds((current) => [...current, productionToAdd])
    const nextAvailable = availableProductions.find((p) => p.id !== productionToAdd)
    setProductionToAdd(nextAvailable?.id ?? '')
    setIsProductionPopupOpen(false)
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

    if (selectedProductionIds.length === 0) {
      setError(i18n.admin.posters.validationProductionRequired)
      return
    }

    if (!selectedFile) {
      setError(i18n.admin.posters.validationFileRequired)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const fileBase64 = await fileToBase64(selectedFile)

      await apiFetch('/archive/posters', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          production_ids: selectedProductionIds,
          file_name: selectedFile.name,
          mime_type: selectedFile.type || 'image/jpeg',
          file_base64: fileBase64,
        }),
      })

      setTitle('')
      setSelectedFile(null)
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
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null
                setSelectedFile(nextFile)
              }}
              className="block w-full rounded-md border border-[var(--color-admin-card-border)] p-2"
            />
          </label>

          <ProductionManagementSection
            compact
            selectedProductions={selectedProductions}
            availableProductions={availableProductions}
            productionToAdd={productionToAdd}
            productionSearchQuery={productionSearchQuery}
            isProductionPopupOpen={isProductionPopupOpen}
            isLoadingProductions={isLoadingProductions}
            productionsError={productionError ?? ''}
            onOpenPopup={openProductionPopup}
            onClosePopup={() => setIsProductionPopupOpen(false)}
            onSelectProductionToAdd={setProductionToAdd}
            onProductionSearchQueryChange={setProductionSearchQuery}
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
                      title={`${poster.title} PDF preview`}
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
                    <p className="text-xs text-muted">{poster.production?.title ?? i18n.admin.posters.noProductionAssigned}</p>
                    <p className="text-xs text-muted">{new Date(poster.created_at).toLocaleDateString('nl-BE')}</p>
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
