import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import type { ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'
import CreateBlogPage from '../../pages/admin/CreateBlogPage'

const navigate = vi.fn()
let params: { id?: string } = {}

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))

const apiFetchMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => params,
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
      return {
        data: productionList,
        meta: {
          total: productionList.length,
          page: 1,
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

function mockEditBlog() {
  apiMock.get.mockImplementation(async (endpoint: string) => {
    if (endpoint === '/archive/blogs/blog-123') {
      return {
        data: {
          id: 'blog-123',
          title: JSON.stringify({ nl: 'Bestaande titel', en: 'Existing title' }),
          content: {
            nl: 'Bestaande inhoud',
            en: 'Existing content',
          },
          productions: [],
        },
      }
    }

    throw new Error(`Unexpected api.get endpoint: ${endpoint}`)
  })
}

function renderCreatePage() {
  setPath('/nl/admin/blogs/create')
  params = {}
  return render(<CreateBlogPage />)
}

function renderEditPage() {
  setPath('/nl/admin/blogs/blog-123/edit')
  params = { id: 'blog-123' }
  return render(<CreateBlogPage />)
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

  it('navigates back to the admin dashboard shell when the back button is clicked', async () => {
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /Terug|Back/ }))

    expect(navigate).toHaveBeenCalledWith('/admin')
  })

  it('shows an error when nothing is filled in', async () => {
    renderCreatePage()

    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    expect(await screen.findByText('Vul minstens één taal in voordat je publiceert.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
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

  it('creates a blog when publish succeeds', async () => {
    mockCreateSuccess()
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/archive/productions?page=1&limit=100&sort=relevance&lang=nl',
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

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledTimes(1)
      expect(apiMock.post).toHaveBeenCalledWith(
        '/archive/blogs',
        expect.objectContaining({
          title: JSON.stringify({ nl: 'Nieuwe blogtitel', en: null }),
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

  it('edits an existing blog and submits a PATCH request', async () => {
    mockEditBlog()
    renderEditPage()

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/archive/blogs/blog-123')
    })

    fireEvent.change(screen.getByLabelText('blog title'), {
      target: { value: 'Aangepaste titel' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Publiceren' })[0])

    await waitFor(() => {
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
    expect(body.title).toBe(JSON.stringify({ nl: 'Aangepaste titel', en: 'Existing title' }))
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

  it('opens the production popup, adds a production, and removes it again', async () => {
    renderCreatePage()

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Producties beheren' }))
    expect(screen.getByText('Kies een production')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Eerste productie/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))

    expect(screen.getByText('Eerste productie')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Verwijder productie' }))
    expect(screen.queryByText('Eerste productie')).not.toBeInTheDocument()
  })
})
