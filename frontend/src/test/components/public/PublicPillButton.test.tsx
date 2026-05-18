import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PublicPillButton from '../../../components/public/PublicPillButton'

describe('PublicPillButton', () => {
    it('renders the provided label', () => {
        render(<PublicPillButton label="lees meer" />)
        expect(screen.getByRole('button', { name: 'lees meer' })).toBeInTheDocument()
    })

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn()
        render(<PublicPillButton label="klik hier" onClick={handleClick} />)
        fireEvent.click(screen.getByRole('button', { name: 'klik hier' }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not throw when onClick is omitted and button is clicked', () => {
        render(<PublicPillButton label="geen handler" />)
        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow()
    })

    it('renders a button of type "button" by default', () => {
        render(<PublicPillButton label="default" />)
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('renders a submit button when type="submit"', () => {
        render(<PublicPillButton label="verzenden" type="submit" />)
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('applies solid variant styles by default', () => {
        render(<PublicPillButton label="solid" />)
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-foreground')
        expect(button.className).toContain('text-background')
    })

    it('applies outline variant styles when variant="outline"', () => {
        render(<PublicPillButton label="outline" variant="outline" />)
        const button = screen.getByRole('button')
        expect(button.className).toContain('border-foreground')
        expect(button.className).toContain('text-foreground')
        // solid variant has 'bg-foreground' as direct class; outline only has 'hover:bg-foreground'
        expect(button.className).not.toContain(' bg-foreground ')
    })

    it('appends extra className to the button', () => {
        render(<PublicPillButton label="custom" className="min-w-28" />)
        expect(screen.getByRole('button').className).toContain('min-w-28')
    })
})
