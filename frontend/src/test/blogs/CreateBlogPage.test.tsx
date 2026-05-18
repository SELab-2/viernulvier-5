import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import CreateBlogPage from '../../pages/admin/CreateBlogPage'
import { getMessages } from '../../i18n'

const navigate = vi.fn()
let params: { id?: string } = {}

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))

const apiFetchMock = vi.hoisted(() => vi.fn())
const messages = getMessages('nl')
const currentYear = new Date().getFullYear()
const productionFetchEndpoint = `/archive/productions?page=1&limit=100&sort=recent&lang=nl&pastOnly=false&draft=all&yearFrom=1982&yearTo=${currentYear}`
const secondProductionFetchEndpoint = `/archive/productions?page=2&limit=100&sort=recent&lang=nl&pastOnly=false&draft=all&yearFrom=1982&yearTo=${currentYear}`

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => params,
    useLocation: () => ({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      state: null,
      key: 'test-location',
    }),
  }
})

vi.mock('../../api/client', () => ({
  api: apiMock,
  apiFetch: apiFetchMock,
}))

vi.mock('../../components/public/PublicNavbar', () => ({
  default: () => <div>Public navbar</div>,
}))

vi.mock('../../components/admin/SectionHeading', () => ({
  default: ({ title, subTitle }: { title: string; subTitle: string }) => (
    <section>
      <h1>{title}</h1>
      <p>{subTitle}</p>
    </section>
  ),
}))

vi.mock('../../components/admin/BlogsTabContent', () => ({
  default: ({
    title,
    content,
    changeTitle,
    changeContent,
    onJsonChange,
    titleLabel,
    contentLabel,
  }: {
    title: string
    content: string
    changeTitle: (value: string) => void
    changeContent: (value: string) => void
    onJsonChange: (value: unknown) => void
    titleLabel: string
    contentLabel: string
  }) => (
    <section>
      <label>
        {titleLabel}
        <input
          aria-label="blog title"
          value={title}
          onChange={(event) => changeTitle(event.target.value)}
        />
      </label>
      <label>
        {contentLabel}
        <textarea
          aria-label="blog content"
          value={content}
          onChange={(event) => changeContent(event.target.value)}
        />
      </label>
      <button type="button" onClick={() => onJsonChange({ ops: [{ insert: content || 'rich content' }] })}>
        set json content
      </button>
    </section>
  ),
}))

function setPath(pathname: string) {
  window.history.replaceState(window.history.state, '', pathname)
}

function createProduction(overrides: Partial<ProductionItem>): ProductionItem {
  return {
    id: 'production-1',
    title: { nl: 'Eerste productie', en: 'First production' },
    description_short: { nl: 'Korte beschrijving', en: 'Short description' },
    description: { nl: 'Volledige beschrijving', en: 'Full description' },
    teaser: { nl: 'Teaser', en: 'Teaser' },
    image_url: 'https://example.com/image.jpg',
    created_at: '2026-04-21T00:00:00.000Z',
    venue_name: 'Theaterzaal',
    venue_names: ['Theaterzaal'],
    attendance_mode: 'offline',
    ...overrides,
  }
}

const productionList: ProductionItem[] = [
  createProduction({ id: 'production-1' }),
  createProduction({ id: 'production-2', title: { nl: 'Tweede productie', en: 'Second production' } }),
]

function mockAvailableProductions() {
  apiFetchMock.mockImplementation(async (endpoint: string) => {
    if (endpoint.startsWith('/archive/productions?')) {
      const page = Number(new URLSearchParams(endpoint.split('?')[1]).get('page') ?? '1')

      return {
        data: page === 1 ? productionList : [createProduction({ id: 'production-3', title: { nl: 'Derde productie', en: 'Third production' } })],
        meta: {
          total: page === 1 ? productionList.length : 3,
          page,
          limit: 100,
          totalPages: 1,
        },
      }
    }

    if (endpoint.startsWith('/archive/blogs/')) {
      return { data: { id: 'blog-123' } }
    }

    throw new Error(`Unexpected apiFetch endpoint: ${endpoint}`)
  })
}

function mockCreateSuccess() {
  apiMock.post.mockResolvedValueOnce({ data: { id: 'blog-created' } })
}

function mockEditBlog(overrides?: {
  title?: string
  content?: { nl?: string | null; en?: string | null }
  productions?: string[]
}) {
  apiMock.get.mockImplementation(async (endpoint: string) => {
    if (endpoint === '/archive/blogs/blog-123') {
      return {
        data: {
          id: 'blog-123',
          title: overrides?.title ?? JSON.stringify({ nl: 'Bestaande titel', en: 'Existing title' }),
          content: overrides?.content ?? {
            nl: 'Bestaande inhoud',
            en: 'Existing content',
          },
          productions: overrides?.productions ?? [],
        },
      }
    }

    throw new Error(`Unexpected api.get endpoint: ${endpoint}`)
  })
}

function renderCreatePage() {
  setPath('/nl/admin/blogs/create')
  params = {}
  return render(
    <MemoryRouter initialEntries={[window.location.pathname]}>
      <CreateBlogPage />
    </MemoryRouter>,
  )
}

function renderEditPage() {
  setPath('/nl/admin/blogs/blog-123/edit')
  params = { id: 'blog-123' }
  return render(
    <MemoryRouter initialEntries={[window.location.pathname]}>
      <CreateBlogPage />
    </MemoryRouter>,
  )
}

describe('CreateBlogPage', () => {
  beforeEach(() => {
    navigate.mockReset()
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    apiMock.delete.mockReset()
    apiFetchMock.mockReset()

    window.localStorage.setItem('locale', 'nl')
    document.documentElement.lang = 'nl'
    mockAvailableProductions()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows an error when nothing is filled in', async () => {
    renderCreatePage()

    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByText('Vul minstens één taal in voordat je publiceert.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
  })

  it('updates localStorage and document lang when switching the editor language tab', async () => {
    renderCreatePage()

    fireEvent.click(screen.getByRole('button', { name: 'Engels' }))

    expect(window.localStorage.getItem('locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('shows an error when a language has content but no title', async () => {
    renderCreatePage()

    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>Alleen content</p>' },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByText('Als een taal is ingevuld, moet die ook een titel hebben.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
  })

  it('shows an error when a language has title but no content', async () => {
    renderCreatePage()

    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'Alleen titel' },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByText('Als een taal een titel heeft, moet die ook content hebben.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
  })

  it('creates a blog when publish succeeds', async () => {
    mockCreateSuccess()
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        productionFetchEndpoint,
        expect.any(Object),
      )
    })

    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'Nieuwe blogtitel' },
    })
    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>Nieuwe inhoud</p>' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByRole('dialog')).toHaveAttribute('aria-label', messages.blogs.publishConfirmTitle)
    expect(screen.getByText(messages.blogs.publishConfirmWithoutEnglish)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.publishConfirmProceed }))

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledTimes(1)
      expect(apiMock.post).toHaveBeenCalledWith(
        '/archive/blogs',
        expect.objectContaining({
          title: { nl: 'Nieuwe blogtitel', en: null },
          content: {
            nl: '<p>Nieuwe inhoud</p>',
            en: null,
          },
          productionIds: [],
        }),
      )
      expect(navigate).toHaveBeenCalledWith('/blogs/blog-created')
    })
  })

  it('shows the Dutch warning when publishing without a Dutch version', async () => {
    mockCreateSuccess()
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        productionFetchEndpoint,
        expect.any(Object),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.englishOption }))
    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'English title' },
    })
    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>English content</p>' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByRole('dialog')).toHaveTextContent(messages.blogs.publishConfirmWithoutDutch)
  })

  it('edits an existing blog and submits a PATCH request', async () => {
    mockEditBlog({
      productions: ['production-1'],
    })
    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    expect(screen.getByLabelText('blog title')).toHaveValue('Bestaande titel')
    expect(screen.getByLabelText('blog content')).toHaveValue('Bestaande inhoud')
    expect(screen.getByText('Eerste productie')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.englishOption }))
    expect(screen.getByLabelText('blog title')).toHaveValue('Existing title')
    expect(screen.getByLabelText('blog content')).toHaveValue('Existing content')

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.dutchOption }))

    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'Aangepaste titel' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    await waitFor(() => {
      expect(apiMock.post).not.toHaveBeenCalled()
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/archive/blogs/blog-123',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(String),
        }),
      )
      expect(navigate).toHaveBeenCalledWith('/blogs/blog-123')
    })

    const patchCall = apiFetchMock.mock.calls.find(([endpoint, options]) => endpoint === '/archive/blogs/blog-123' && options?.method === 'PATCH')
    expect(patchCall).toBeDefined()

    const body = JSON.parse(String(patchCall?.[1]?.body))
    expect(body.title).toEqual({ nl: 'Aangepaste titel', en: 'Existing title' })
  })

  it('deletes a blog after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiMock.delete.mockResolvedValueOnce(undefined)
    mockEditBlog()

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verwijder blog' }))

    await waitFor(() => {
      expect(apiMock.delete).toHaveBeenCalledWith('/archive/blogs/blog-123')
      expect(navigate).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('does not delete a blog when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockEditBlog()

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verwijder blog' }))

    await waitFor(() => {
      expect(apiMock.delete).not.toHaveBeenCalled()
    })
  })

  it('shows a delete error when deleting fails with an unknown error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiMock.delete.mockRejectedValueOnce('delete failed')
    mockEditBlog()

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verwijder blog' }))

    expect(await screen.findByText(messages.blogs.deleteError)).toBeInTheDocument()
  })

  it('shows not found state in edit mode when the blog does not exist', async () => {
    apiMock.get.mockRejectedValueOnce(new Error('404 not found'))

    renderEditPage()

    expect(await screen.findByText(messages.blogs.blogNotFound)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: messages.blogs.editBlogTitle })).not.toBeInTheDocument()
  })

  it('shows a load error in edit mode for non-404 failures', async () => {
    apiMock.get.mockRejectedValueOnce(new Error('Failed to load existing blog'))

    renderEditPage()

    expect(await screen.findByText('Failed to load existing blog')).toBeInTheDocument()
  })

  it('shows a save error when creating a blog fails', async () => {
    apiMock.post.mockRejectedValueOnce('create failed')
    renderCreatePage()

    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'Nieuwe blogtitel' },
    })
    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>Nieuwe inhoud</p>' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])
    fireEvent.click(await screen.findByRole('button', { name: messages.blogs.publishConfirmProceed }))

    expect(await screen.findByText('Failed to save blog.')).toBeInTheDocument()
  })

  it('updates existing blog content with PATCH body and does not create a new one', async () => {
    mockEditBlog()

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>Aangepaste NL content</p>' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'set json content' }))

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.englishOption }))
    fireEvent.click(screen.getByRole('button', { name: 'set json content' }))
    fireEvent.change(screen.getByLabelText('blog content'), {
      target: { value: '<p>Updated EN content</p>' },
    })

    fireEvent.click(screen.getByRole('button', { name: messages.blogs.dutchOption }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    await waitFor(() => {
      expect(apiMock.post).not.toHaveBeenCalled()
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/archive/blogs/blog-123',
        expect.objectContaining({ method: 'PATCH', body: expect.any(String) }),
      )
    })

    const patchCall = apiFetchMock.mock.calls.find(
      ([endpoint, options]) => endpoint === '/archive/blogs/blog-123' && options?.method === 'PATCH',
    )

    expect(patchCall).toBeDefined()
    const body = JSON.parse(String(patchCall?.[1]?.body)) as {
      title: string
      content: { nl: unknown; en: unknown }
      productionIds: string[]
    }

    expect(body.content.nl).toEqual({ ops: [{ insert: '<p>Aangepaste NL content</p>' }] })
    expect(body.content.en).toEqual({ ops: [{ insert: 'Existing content' }] })
  })

  it('opens the production popup, adds a production, and removes it again', async () => {
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Producties beheren' }))
    expect(screen.getByText('Kies een productie')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Eerste productie/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))

    expect(screen.getByText('Eerste productie')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Verwijder productie' }))
    expect(screen.queryByText('Eerste productie')).not.toBeInTheDocument()
  })

  it('keeps staged productions visible after changing the production search', async () => {
    apiFetchMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === productionFetchEndpoint) {
        return {
          data: productionList,
          meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
        }
      }

      if (endpoint.includes('search=eerste')) {
        return {
          data: [productionList[0]],
          meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
        }
      }

      throw new Error(`Unexpected apiFetch endpoint: ${endpoint}`)
    })

    renderCreatePage()

    fireEvent.click(await screen.findByRole('button', { name: 'Producties beheren' }))
    fireEvent.click(screen.getByRole('button', { name: /Tweede productie/i }))
    fireEvent.change(screen.getByPlaceholderText('Zoek productie'), { target: { value: 'eerste' } })

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(expect.stringContaining('search=eerste'), expect.any(Object))
    })

    expect(screen.queryByText('Geselecteerde producties')).not.toBeInTheDocument()
    expect(screen.getByText('Tweede productie')).toBeInTheDocument()
  })

  it('fetches the next production page when the picker scrolls to the bottom', async () => {
    apiFetchMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === productionFetchEndpoint) {
        return {
          data: [productionList[0]],
          meta: { total: 2, page: 1, limit: 100, totalPages: 2 },
        }
      }

      if (endpoint === secondProductionFetchEndpoint) {
        return {
          data: [productionList[1]],
          meta: { total: 2, page: 2, limit: 100, totalPages: 2 },
        }
      }

      throw new Error(`Unexpected apiFetch endpoint: ${endpoint}`)
    })

    renderCreatePage()

    fireEvent.click(await screen.findByRole('button', { name: 'Producties beheren' }))
    await screen.findByText('Eerste productie')

    const resultsRegion = screen.getByText('Eerste productie').closest('.overflow-y-auto')
    expect(resultsRegion).not.toBeNull()

    Object.defineProperties(resultsRegion, {
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 850 },
      clientHeight: { configurable: true, value: 100 },
    })

    fireEvent.scroll(resultsRegion as Element)

    await screen.findByText('Tweede productie')
    expect(apiFetchMock).toHaveBeenCalledWith(secondProductionFetchEndpoint, expect.any(Object))
  })

  it('allows uploading images, selecting a thumbnail and uploads them on publish', async () => {
    mockCreateSuccess()

    // Mock FileReader so base64 conversion works in tests
    const origFileReaderDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'FileReader')

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: class {
        result = 'data:image/png;base64,FAKE'
        onload: ((e?: unknown) => void) | null = null
        onerror: ((e?: unknown) => void) | null = null
        readAsDataURL() {
          if (this.onload) {
            this.onload({ target: { result: this.result } })
          }
        }
      },
    })

    try {
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      renderCreatePage()

      // Find the hidden file input and add a file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      // Preview should show up
      expect(await screen.findByAltText('Blog image 1')).toBeInTheDocument()

      // Select as thumbnail
      fireEvent.click(screen.getByAltText('Blog image 1'))
      expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

      // Fill required fields and publish
      fireEvent.change(screen.getByLabelText('blog title'), { target: { value: 'Nieuwe blogtitel' } })
      fireEvent.change(screen.getByLabelText('blog content'), { target: { value: '<p>Nieuwe inhoud</p>' } })
      fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

      fireEvent.click(await screen.findByRole('button', { name: messages.blogs.publishConfirmProceed }))

      // Expect images upload call was made with files and thumbnail_index=0
      await waitFor(() => {
        const imagesCall = apiFetchMock.mock.calls.find(([endpoint]) => String(endpoint).endsWith('/images'))
        expect(imagesCall).toBeDefined()
        const options = imagesCall?.[1]
        const body = JSON.parse(String(options?.body))
        expect(body).toHaveProperty('files')
        expect(Array.isArray(body.files)).toBe(true)
        expect(body.files[0].file_name).toBe('test.png')
        expect(body.thumbnail_index).toBe(0)
      })
    } finally {
      // Restore FileReader
      if (origFileReaderDescriptor) {
        Object.defineProperty(globalThis, 'FileReader', origFileReaderDescriptor)
      } else {
        delete (globalThis as unknown as { FileReader?: unknown }).FileReader
      }
    }
  })

  it('deleting a preceding image adjusts thumbnail index', async () => {
    // Return a blog with two images and thumbnail on the second
    apiMock.get.mockImplementationOnce(async (endpoint: string) => {
      if (endpoint === '/archive/blogs/blog-123') {
        return {
          data: {
            id: 'blog-123',
            title: JSON.stringify({ nl: 'Bestaande titel', en: 'Existing title' }),
            content: { nl: 'Bestaande inhoud', en: 'Existing content' },
            productions: [],
            images: ['a.jpg', 'b.jpg'],
            thumbnail_index: 1,
          },
        }
      }

      throw new Error(`Unexpected api.get endpoint: ${endpoint}`)
    })

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    // Cover label should be present for image 2
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

    const deleteButtons = screen.getAllByLabelText(messages.blogs.bannerUpload.deleteImageAriaLabel)
    // Delete the first image (index 0)
    fireEvent.click(deleteButtons[0])

    // Now the remaining image should be index 0 and still be the cover
    expect(await screen.findByAltText('Blog image 1')).toBeInTheDocument()
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()
  })

  it('deleting the thumbnail image clears the thumbnail selection', async () => {
    // Return a blog with one image and thumbnail on that image
    apiMock.get.mockImplementationOnce(async (endpoint: string) => {
      if (endpoint === '/archive/blogs/blog-123') {
        return {
          data: {
            id: 'blog-123',
            title: JSON.stringify({ nl: 'Bestaande titel', en: 'Existing title' }),
            content: { nl: 'Bestaande inhoud', en: 'Existing content' },
            productions: [],
            images: ['only.jpg'],
            thumbnail_index: 0,
          },
        }
      }

      throw new Error(`Unexpected api.get endpoint: ${endpoint}`)
    })

    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    // Cover label present initially
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

    const deleteButtons = screen.getAllByLabelText(messages.blogs.bannerUpload.deleteImageAriaLabel)
    fireEvent.click(deleteButtons[0])

    // After deletion, no cover label should be visible
    await waitFor(() => {
      expect(screen.queryByText(messages.blogs.bannerUpload.coverLabel)).not.toBeInTheDocument()
    })
  })

  it('clears pending thumbnail index when the selected pending file is removed', async () => {
    mockCreateSuccess()

    const origFileReaderDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'FileReader')

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: class {
        result = 'data:image/png;base64,FAKE'
        onload: ((e?: unknown) => void) | null = null
        onerror: ((e?: unknown) => void) | null = null
        readAsDataURL() {
          if (this.onload) {
            this.onload({ target: { result: this.result } })
          }
        }
      },
    })

    const fileA = new File(['a'], 'first.png', { type: 'image/png' })
    const fileB = new File(['b'], 'second.png', { type: 'image/png' })

    renderCreatePage()

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [fileA, fileB] } })

    expect(await screen.findByAltText('Blog image 2')).toBeInTheDocument()

    fireEvent.click(screen.getByAltText('Blog image 2'))
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

    const deleteButtons = screen.getAllByLabelText(messages.blogs.bannerUpload.deleteImageAriaLabel)
    fireEvent.click(deleteButtons[1])

    await waitFor(() => {
      expect(screen.queryByText(messages.blogs.bannerUpload.coverLabel)).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('blog title'), { target: { value: 'Nieuwe blogtitel' } })
    fireEvent.change(screen.getByLabelText('blog content'), { target: { value: '<p>Nieuwe inhoud</p>' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])
    fireEvent.click(await screen.findByRole('button', { name: messages.blogs.publishConfirmProceed }))

    await waitFor(() => {
      const imagesCall = apiFetchMock.mock.calls.find(([endpoint]) => String(endpoint).endsWith('/images'))
      expect(imagesCall).toBeDefined()
      const options = imagesCall?.[1]
      const body = JSON.parse(String(options?.body))
      expect(body.thumbnail_index).toBeNull()
    })

    if (origFileReaderDescriptor) {
      Object.defineProperty(globalThis, 'FileReader', origFileReaderDescriptor)
    } else {
      delete (globalThis as unknown as { FileReader?: unknown }).FileReader
    }
  })

  it('shifts pending thumbnail index when a preceding pending file is removed', async () => {
    mockCreateSuccess()

    const origFileReaderDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'FileReader')

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: class {
        result = 'data:image/png;base64,FAKE'
        onload: ((e?: unknown) => void) | null = null
        onerror: ((e?: unknown) => void) | null = null
        readAsDataURL() {
          if (this.onload) {
            this.onload({ target: { result: this.result } })
          }
        }
      },
    })

    const fileA = new File(['a'], 'first.png', { type: 'image/png' })
    const fileB = new File(['b'], 'second.png', { type: 'image/png' })

    renderCreatePage()

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [fileA, fileB] } })

    expect(await screen.findByAltText('Blog image 2')).toBeInTheDocument()

    fireEvent.click(screen.getByAltText('Blog image 2'))
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

    const deleteButtons = screen.getAllByLabelText(messages.blogs.bannerUpload.deleteImageAriaLabel)
    fireEvent.click(deleteButtons[0])

    expect(await screen.findByAltText('Blog image 1')).toBeInTheDocument()
    expect(screen.getByText(messages.blogs.bannerUpload.coverLabel)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('blog title'), { target: { value: 'Nieuwe blogtitel' } })
    fireEvent.change(screen.getByLabelText('blog content'), { target: { value: '<p>Nieuwe inhoud</p>' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])
    fireEvent.click(await screen.findByRole('button', { name: messages.blogs.publishConfirmProceed }))

    await waitFor(() => {
      const imagesCall = apiFetchMock.mock.calls.find(([endpoint]) => String(endpoint).endsWith('/images'))
      expect(imagesCall).toBeDefined()
      const options = imagesCall?.[1]
      const body = JSON.parse(String(options?.body))
      expect(body.thumbnail_index).toBe(0)
    })

    if (origFileReaderDescriptor) {
      Object.defineProperty(globalThis, 'FileReader', origFileReaderDescriptor)
    } else {
      delete (globalThis as unknown as { FileReader?: unknown }).FileReader
    }
  })

})
