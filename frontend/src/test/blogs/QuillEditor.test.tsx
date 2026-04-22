import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import QuillEditor from '../../components/admin/blogs/QuillEditor'

type QuillOptions = {
  modules?: {
    toolbar?: {
      handlers?: {
        image?: () => void
      }
    }
  }
}

const quillState = vi.hoisted(() => ({
  instances: [] as Array<{
    root: { innerHTML: string }
    clipboard: { dangerouslyPasteHTML: Mock }
    on: Mock
    getContents: Mock
    getSelection: Mock
    getLength: Mock
    insertEmbed: Mock
    setSelection: Mock
    setText: Mock
    triggerTextChange: () => void
    options?: QuillOptions
  }>,
}))

vi.mock('quill', () => {
  return {
    default: class MockQuill {
      static instances = quillState.instances

      root = { innerHTML: '' }
      options?: QuillOptions
      private textChangeHandler: (() => void) | null = null

      clipboard = {
        dangerouslyPasteHTML: vi.fn((html: string) => {
          this.root.innerHTML = html
        }),
      }

      on = vi.fn((event: string, callback: () => void) => {
        if (event === 'text-change') {
          this.textChangeHandler = callback
        }
      })

      getContents = vi.fn(() => ({ ops: [{ insert: 'json content' }] }))
      getSelection = vi.fn(() => ({ index: 2 }))
      getLength = vi.fn(() => 8)
      insertEmbed = vi.fn()
      setSelection = vi.fn()
      setText = vi.fn((text: string) => {
        this.root.innerHTML = text
      })

      constructor(_container: HTMLDivElement, options: QuillOptions) {
        this.options = options
        MockQuill.instances.push(this)
      }

      triggerTextChange() {
        this.textChangeHandler?.()
      }
    },
  }
})

function latestInstance() {
  return quillState.instances[quillState.instances.length - 1]
}

describe('QuillEditor', () => {
  beforeEach(() => {
    quillState.instances.length = 0
  })

  it('initializes quill and pastes initial html content', () => {
    const onChange = vi.fn()

    render(
      <QuillEditor
        value="<p>Start</p>"
        onChange={onChange}
        placeholder="Type here"
      />,
    )

    const instance = latestInstance()
    expect(instance).toBeDefined()
    expect(instance.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith('<p>Start</p>')
  })

  it('emits html and json when quill text changes', () => {
    const onChange = vi.fn()
    const onJsonChange = vi.fn()

    render(
      <QuillEditor
        value="<p>Start</p>"
        onChange={onChange}
        onJsonChange={onJsonChange}
      />,
    )

    const instance = latestInstance()
    instance.root.innerHTML = '<p>Changed</p>'
    instance.triggerTextChange()

    expect(onChange).toHaveBeenCalledWith('<p>Changed</p>')
    expect(onJsonChange).toHaveBeenCalledWith({ ops: [{ insert: 'json content' }] })
  })

  it('syncs external value updates and clears editor when value becomes empty', () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <QuillEditor
        value="<p>Initial</p>"
        onChange={onChange}
      />,
    )

    const instance = latestInstance()
    expect(instance.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith('<p>Initial</p>')

    instance.clipboard.dangerouslyPasteHTML.mockClear()

    rerender(
      <QuillEditor
        value="<p>Initial</p>"
        onChange={onChange}
      />,
    )

    expect(instance.clipboard.dangerouslyPasteHTML).not.toHaveBeenCalled()

    rerender(
      <QuillEditor
        value="<p>Updated</p>"
        onChange={onChange}
      />,
    )

    expect(instance.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith('<p>Updated</p>')

    rerender(
      <QuillEditor
        value=""
        onChange={onChange}
      />,
    )

    expect(instance.setText).toHaveBeenCalledWith('')
  })

  it('handles image toolbar upload via onImageUpload and inserts embed', async () => {
    const onChange = vi.fn()
    const onImageUpload = vi.fn().mockResolvedValue('https://cdn.example.com/image.png')

    const inputElement = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      files: [] as File[],
      onchange: null as null | (() => Promise<void>),
    }

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return inputElement as unknown as HTMLInputElement
      }

      return originalCreateElement(tagName)
    })

    try {
      render(
        <QuillEditor
          value=""
          onChange={onChange}
          onImageUpload={onImageUpload}
        />,
      )

      const instance = latestInstance()
      const imageHandler = instance.options?.modules?.toolbar?.handlers?.image
      expect(imageHandler).toBeDefined()

      imageHandler?.()
      expect(inputElement.click).toHaveBeenCalledTimes(1)

      inputElement.files = [new File(['x'], 'photo.png', { type: 'image/png' })]
      await inputElement.onchange?.()

      expect(onImageUpload).toHaveBeenCalledTimes(1)
      expect(instance.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://cdn.example.com/image.png', 'user')
      expect(instance.setSelection).toHaveBeenCalledWith(3, 0)
    } finally {
      createElementSpy.mockRestore()
    }
  })

  it('returns early when image input has no file selected', async () => {
    const onChange = vi.fn()

    const inputElement = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      files: [] as File[],
      onchange: null as null | (() => Promise<void>),
    }

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return inputElement as unknown as HTMLInputElement
      }

      return originalCreateElement(tagName)
    })

    try {
      render(
        <QuillEditor
          value=""
          onChange={onChange}
        />,
      )

      const instance = latestInstance()
      const imageHandler = instance.options?.modules?.toolbar?.handlers?.image
      imageHandler?.()
      await inputElement.onchange?.()

      expect(instance.insertEmbed).not.toHaveBeenCalled()
      expect(instance.setSelection).not.toHaveBeenCalled()
    } finally {
      createElementSpy.mockRestore()
    }
  })

  it('falls back to FileReader upload when no onImageUpload is provided', async () => {
    const onChange = vi.fn()

    const inputElement = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      files: [] as File[],
      onchange: null as null | (() => Promise<void>),
    }

    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return inputElement as unknown as HTMLInputElement
      }

      return originalCreateElement(tagName)
    })

    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      result: string | ArrayBuffer | null = null
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      readAsDataURL(_file: File) {
        this.result = 'data:image/png;base64,abc123'
        this.onload?.()
      }
    }

    globalThis.FileReader = MockFileReader as unknown as typeof FileReader

    try {
      render(
        <QuillEditor
          value=""
          onChange={onChange}
        />,
      )

      const instance = latestInstance()
      const imageHandler = instance.options?.modules?.toolbar?.handlers?.image
      imageHandler?.()

      inputElement.files = [new File(['x'], 'photo.png', { type: 'image/png' })]
      await inputElement.onchange?.()

      expect(instance.insertEmbed).toHaveBeenCalledWith(2, 'image', 'data:image/png;base64,abc123', 'user')
      expect(instance.setSelection).toHaveBeenCalledWith(3, 0)
    } finally {
      createElementSpy.mockRestore()
      globalThis.FileReader = originalFileReader
    }
  })
})
