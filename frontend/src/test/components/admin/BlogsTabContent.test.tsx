import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BlogsTabContent from '../../../components/admin/BlogsTabContent'

const quillPropsRef = vi.hoisted(() => ({
  current: null as null | {
    value: string
    onChange: (value: string) => void
    onJsonChange?: (value: unknown) => void
    placeholder?: string
  },
}))

vi.mock('../../../components/admin/blogs/QuillEditor', () => ({
  default: ({ value, onChange, onJsonChange, placeholder }: {
    value: string
    onChange: (value: string) => void
    onJsonChange?: (value: unknown) => void
    placeholder?: string
  }) => {
    quillPropsRef.current = { value, onChange, onJsonChange, placeholder }

    return (
      <div>
        <span data-testid="quill-value">{value}</span>
        <span data-testid="quill-placeholder">{placeholder}</span>
        <button type="button" onClick={() => onChange('<p>Nieuwe inhoud</p>')}>Trigger Quill Change</button>
        <button type="button" onClick={() => onJsonChange?.({ ops: [{ insert: 'Nieuwe json inhoud' }] })}>Trigger Quill Json</button>
      </div>
    )
  },
}))

describe('BlogsTabContent', () => {
  it('renders labels and current title/content state', () => {
    render(
      <BlogsTabContent
        titleLabel="titel"
        contentLabel="content"
        title="Bestaande titel"
        content="<p>Bestaande content</p>"
        changeTitle={vi.fn()}
        changeContent={vi.fn()}
        onJsonChange={vi.fn()}
        quillPlaceholder="Schrijf je blog content hier..."
      />,
    )

    expect(screen.getByText('titel')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bestaande titel')).toBeInTheDocument()
    expect(screen.getByTestId('quill-value')).toHaveTextContent('<p>Bestaande content</p>')
    expect(screen.getByTestId('quill-placeholder')).toHaveTextContent('Schrijf je blog content hier...')
  })

  it('forwards title and quill change handlers', () => {
    const changeTitle = vi.fn()
    const changeContent = vi.fn()
    const onJsonChange = vi.fn()

    render(
      <BlogsTabContent
        titleLabel="titel"
        contentLabel="content"
        title=""
        content=""
        changeTitle={changeTitle}
        changeContent={changeContent}
        onJsonChange={onJsonChange}
        quillPlaceholder="Schrijf je blog content hier..."
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Aangepaste titel' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Quill Change' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Quill Json' }))

    expect(changeTitle).toHaveBeenCalledWith('Aangepaste titel')
    expect(changeContent).toHaveBeenCalledWith('<p>Nieuwe inhoud</p>')
    expect(onJsonChange).toHaveBeenCalledWith({ ops: [{ insert: 'Nieuwe json inhoud' }] })
    expect(quillPropsRef.current?.value).toBe('')
  })
})
