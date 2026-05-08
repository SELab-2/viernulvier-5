import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import BlogDetailPage from '../../pages/public/BlogDetailPage'
import { getMessages } from '../../i18n'

const apiGetMock = vi.hoisted(() => vi.fn())

const messages = getMessages()

vi.mock('../../api/client', () => ({
  api: {
    get: apiGetMock,
  },
}))

vi.mock('../../components/public/PublicLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
    setPath('/nl/blogs/blog-1')

    apiGetMock.mockResolvedValueOnce({
      data: {
        id: 'blog-1',
        title: JSON.stringify({ nl: '', en: 'English title' }),
        content: {
          nl: '',
          en: JSON.stringify({ ops: [{ insert: 'English content' }] }),
        },
        productions: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/nl/blogs/blog-1']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('English title')).toBeInTheDocument()
    expect(await screen.findByText('English content')).toBeInTheDocument()
    expect(screen.queryByText(messages.blogs.languageError)).not.toBeInTheDocument()
    expect(screen.queryByText('Gerelateerde producties')).not.toBeInTheDocument()
  })

  it('shows a not found message when no blog id is available', async () => {
    setPath('/nl/blogs')

    render(
      <MemoryRouter initialEntries={['/nl/blogs']}>
        <Routes>
          <Route path="/nl/blogs" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Blog not found.')).toBeInTheDocument()
    expect(apiGetMock).not.toHaveBeenCalled()
  })

  it('renders Dutch content and linked productions when the blog has them', async () => {
    setPath('/nl/blogs/blog-2')

    apiGetMock
      .mockResolvedValueOnce({
        data: {
          id: 'blog-2',
          title: JSON.stringify({ nl: 'Nederlandse blogtitel', en: 'English title' }),
          content: {
            nl: JSON.stringify({ ops: [{ insert: 'Blog content nederlands' }] }),
            en: JSON.stringify({ ops: [{ insert: 'Blog content Engels' }] }),
          },
          productions: ['production-1', 'production-2'],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'production-1',
          title: { nl: 'Eerste productie', en: 'First production' },
          description_short: { nl: 'Korte beschrijving', en: 'Short description' },
          created_at: '2026-04-21T00:00:00.000Z',
          venue_name: 'Theaterzaal',
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'production-2',
          title: { nl: 'Tweede productie', en: 'Second production' },
          description_short: { nl: 'Tweede korte beschrijving', en: 'Second short description' },
          created_at: '2026-04-21T00:00:00.000Z',
          venue_name: 'Concertzaal',
        },
      })

    render(
      <MemoryRouter initialEntries={['/nl/blogs/blog-2']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Blog content nederlands')).toBeInTheDocument()
    expect(screen.queryByText('Blog content Engels')).not.toBeInTheDocument()

    expect(await screen.findByText('Gerelateerde producties')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Eerste productie/i })).toHaveAttribute('href', '/nl/archive/production-1')
    expect(screen.getByRole('link', { name: /Tweede productie/i })).toHaveAttribute('href', '/nl/archive/production-2')
  })

  it('renders English content when the active locale is en', async () => {
    window.localStorage.setItem('locale', 'en')
    document.documentElement.lang = 'en'
    setPath('/en/blogs/blog-3')

    apiGetMock.mockResolvedValueOnce({
      data: {
        id: 'blog-3',
        title: JSON.stringify({ nl: 'Nederlandse titel', en: 'English title' }),
        content: {
          nl: JSON.stringify({ ops: [{ insert: 'Blog content nederlands' }] }),
          en: JSON.stringify({ ops: [{ insert: 'Blog content English' }] }),
        },
        productions: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/en/blogs/blog-3']}>
        <Routes>
          <Route path="/en/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Blog content English')).toBeInTheDocument()
    expect(screen.queryByText('Blog content nederlands')).not.toBeInTheDocument()
  })

})
