import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionTitle from '../../../components/public/SectionTitle'

describe('SectionTitle', () => {
  it('renders title with default centered alignment and optional subtitle hidden', () => {
    const { container } = render(<SectionTitle title="Archief" />)

    expect(screen.getByRole('heading', { name: 'Archief' })).toBeInTheDocument()
    expect(screen.queryByText('Subtitel')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveClass('mb-10', 'text-center')
  })

  it('renders subtitle and left alignment when requested', () => {
    const { container } = render(<SectionTitle title="Archief" subtitle="Subtitel" align="left" />)

    expect(screen.getByText('Subtitel')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-left')
    expect(container.firstChild).not.toHaveClass('text-center')
  })
})
