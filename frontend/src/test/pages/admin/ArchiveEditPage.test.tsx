import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArchiveEditPage from '../../../pages/admin/ArchiveEditPage'

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ArchiveEditPage', () => {
  it('shows the archive id', () => {
    window.history.replaceState(window.history.state, '', '/admin/archive/42/edit')

    render(
      <MemoryRouter initialEntries={['/admin/archive/42/edit']}>
        <ArchiveEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Item ID:/)).toBeInTheDocument()
  })
})
