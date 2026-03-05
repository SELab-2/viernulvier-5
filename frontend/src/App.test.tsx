import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './pages/public/HomePage'

describe('HomePage', () => {
    it('renders the archive title', () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )
        expect(screen.getByText('VIERNULVIER Archief')).toBeInTheDocument()
    })
})
