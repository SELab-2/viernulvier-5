import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionHeading from '../../../components/admin/SectionHeading'

describe('SectionHeading', () => {
  it('renders title and subtitle', () => {
    render(<SectionHeading title="Bewerk blog" subTitle="Bewerk een bestaande blog" />)

    expect(screen.getByText('Bewerk blog')).toBeInTheDocument()
    expect(screen.getByText('Bewerk een bestaande blog')).toBeInTheDocument()
  })

  it('uses the heading wrapper classes', () => {
    const { container } = render(<SectionHeading title="Titel" subTitle="Subtitel" />)

    expect(container.firstChild).toHaveClass('mx-4', 'mt-8', 'relative', 'overflow-hidden')
  })
})
