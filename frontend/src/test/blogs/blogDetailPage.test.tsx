import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import BlogDetailPage from '../../pages/public/BlogDetailPage'
import { getMessages } from '../../i18n'
import { PublicMessagesContext } from '../../components/public/PublicMessagesContext'

const apiGetMock = vi.hoisted(() => vi.fn())

const messages = getMessages()

const MockApiError = vi.hoisted(() => {
  return class MockApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }
})

vi.mock('../../api/client', () => ({
  api: {
    get: apiGetMock,
  },
  ApiError: MockApiError,
}))

vi.mock('../../components/public/PublicLayout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <PublicMessagesContext.Provider value={getMessages()}>{children}</PublicMessagesContext.Provider>
  ),
}))

vi.mock('quill', () => {
  return {
    default: class MockQuill {
      root: HTMLDivElement

      constructor(container: HTMLDivElement) {
        this.root = document.createElement('div')
        container.appendChild(this.root)
      }

      setContents(delta: { ops?: Array<{ insert?: unknown }> }) {
        this.root.textContent = Array.isArray(delta?.ops)
          ? delta.ops
              .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
              .join('')
          : ''
      }

      setText(text: string) {
        this.root.textContent = text
      }
    },
  }
})

function setPath(pathname: string) {
  window.history.replaceState(window.history.state, '', pathname)
}

describe('BlogDetailPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.localStorage.setItem('locale', 'nl')
    document.documentElement.lang = 'nl'
  })

  it('falls back to the available language when active language is missing', async () => {
    setPath('/nl/blogs/b1000000-0000-0000-0000-000000000001')

    apiGetMock.mockResolvedValueOnce({
      data: {
        id: 'b1000000-0000-0000-0000-000000000001',
        title: JSON.stringify({ nl: '', en: 'English title' }),
        content: {
          nl: '',
          en: JSON.stringify({ ops: [{ insert: 'English content' }] }),
        },
        productions: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/nl/blogs/b1000000-0000-0000-0000-000000000001']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('English title')).toBeInTheDocument()
    expect(screen.getByText('English content')).toBeInTheDocument()
    expect(screen.queryByText(messages.blogs.languageError)).not.toBeInTheDocument()
    expect(screen.queryByText('Gerelateerde producties')).not.toBeInTheDocument()
  })

  it('renders the not-found page when no blog id is available', async () => {
    setPath('/nl/blogs')

    render(
      <MemoryRouter initialEntries={['/nl/blogs']}>
        <Routes>
          <Route path="/nl/blogs" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(messages.notFound.joke)).toBeInTheDocument()
    expect(apiGetMock).not.toHaveBeenCalled()
  })

  it('renders the not-found page when the blog id is not a valid UUID', async () => {
    setPath('/nl/blogs/not-a-uuid')

    render(
      <MemoryRouter initialEntries={['/nl/blogs/not-a-uuid']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(messages.notFound.joke)).toBeInTheDocument()
    expect(apiGetMock).not.toHaveBeenCalled()
  })

  it('renders the not-found page when the API returns 404 for the blog', async () => {
    setPath('/nl/blogs/00000000-0000-0000-0000-000000000000')

    apiGetMock.mockRejectedValueOnce(new MockApiError(404, 'Not found'))

    render(
      <MemoryRouter initialEntries={['/nl/blogs/00000000-0000-0000-0000-000000000000']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(messages.notFound.joke)).toBeInTheDocument()
  })

  it('renders Dutch content and linked productions when the blog has them', async () => {
    setPath('/nl/blogs/b2000000-0000-0000-0000-000000000002')

    apiGetMock
      .mockResolvedValueOnce({
        data: {
          id: 'b2000000-0000-0000-0000-000000000002',
          title: JSON.stringify({ nl: 'Nederlandse blogtitel', en: 'English title' }),
          content: {
            nl: JSON.stringify({ ops: [{ insert: 'Blog content nederlands' }] }),
            en: JSON.stringify({ ops: [{ insert: 'Blog content Engels' }] }),
          },
          productions: ['p1000000-0000-0000-0000-000000000001', 'p2000000-0000-0000-0000-000000000002'],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'p1000000-0000-0000-0000-000000000001',
          title: { nl: 'Eerste productie', en: 'First production' },
          description_short: { nl: 'Korte beschrijving', en: 'Short description' },
          created_at: '2026-04-21T00:00:00.000Z',
          venue_name: 'Theaterzaal',
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'p2000000-0000-0000-0000-000000000002',
          title: { nl: 'Tweede productie', en: 'Second production' },
          description_short: { nl: 'Tweede korte beschrijving', en: 'Second short description' },
          created_at: '2026-04-21T00:00:00.000Z',
          venue_name: 'Concertzaal',
        },
      })

    render(
      <MemoryRouter initialEntries={['/nl/blogs/b2000000-0000-0000-0000-000000000002']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Blog content nederlands')).toBeInTheDocument()
    expect(screen.queryByText('Blog content Engels')).not.toBeInTheDocument()

    expect(await screen.findByText('Gerelateerde producties')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Eerste productie/i })).toHaveAttribute('href', '/nl/archive/p1000000-0000-0000-0000-000000000001')
    expect(screen.getByRole('link', { name: /Tweede productie/i })).toHaveAttribute('href', '/nl/archive/p2000000-0000-0000-0000-000000000002')
  })

  it('renders English content when the active locale is en', async () => {
    window.localStorage.setItem('locale', 'en')
    document.documentElement.lang = 'en'
    setPath('/en/blogs/b3000000-0000-0000-0000-000000000003')

    apiGetMock.mockResolvedValueOnce({
      data: {
        id: 'b3000000-0000-0000-0000-000000000003',
        title: JSON.stringify({ nl: 'Nederlandse titel', en: 'English title' }),
        content: {
          nl: JSON.stringify({ ops: [{ insert: 'Blog content nederlands' }] }),
          en: JSON.stringify({ ops: [{ insert: 'Blog content English' }] }),
        },
        productions: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/en/blogs/b3000000-0000-0000-0000-000000000003']}>
        <Routes>
          <Route path="/en/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Blog content English')).toBeInTheDocument()
    expect(screen.queryByText('Blog content nederlands')).not.toBeInTheDocument()
  })

})
