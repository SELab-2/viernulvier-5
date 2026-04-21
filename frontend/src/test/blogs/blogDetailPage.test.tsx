import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import BlogDetailPage from '../../pages/public/BlogDetailPage'

const apiGetMock = vi.hoisted(() => vi.fn())

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
        this.root = container
      }

      setContents() {
        this.root.innerHTML = '<p>mock</p>'
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

  it('shows an error when the blog does not exist in the active language', async () => {
    setPath('/nl/blogs/blog-1')

    apiGetMock.mockResolvedValueOnce({
      data: {
        id: 'blog-1',
        title: JSON.stringify({ nl: '', en: 'English title' }),
        content: 'Blog content',
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

    expect(await screen.findByText(/Blog .* taal/i)).toBeInTheDocument()
    expect(screen.queryByText('Gerelateerde producties')).not.toBeInTheDocument()
  })

  it('renders linked productions when the blog has them', async () => {
    setPath('/nl/blogs/blog-2')

    apiGetMock
      .mockResolvedValueOnce({
        data: {
          id: 'blog-2',
          title: JSON.stringify({ nl: 'Nederlandse blogtitel', en: 'English title' }),
          content: 'Blog content',
          productions: ['production-1'],
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

    render(
      <MemoryRouter initialEntries={['/nl/blogs/blog-2']}>
        <Routes>
          <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Gerelateerde producties')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Eerste productie/i })).toHaveAttribute('href', '/nl/productions/production-1')
  })
})
