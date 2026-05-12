import { useCallback, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import '../../../styles/QuillEditor.css'

type QuillEditorProps = {
    value: string
    onChange: (value: string) => void
    onJsonChange?: (value: unknown) => void
    placeholder?: string
    onImageUpload?: (file: File) => Promise<string>
    showImages?: boolean
}

const toolbarOptions = (showImages: boolean) => [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    showImages ? ['link', 'image'] : ['link'],
    ['clean'],
]


//TODO: we should upload files to the server instead if saving them in the content json
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
                return
            }

            reject(new Error('Failed to read selected image'))
        }
        reader.onerror = () => reject(new Error('Failed to read selected image'))
        reader.readAsDataURL(file)
    })
}

function QuillEditor({ value, onChange, onJsonChange, placeholder, onImageUpload, showImages = true }: QuillEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const quillRef = useRef<Quill | null>(null)

    const handleImageUpload = useCallback(
        async (quill: Quill) => {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            input.click()

            input.onchange = async () => {
                
                const file = input.files?.[0]
                if (!file) {
                    return
                }

                const selection = quill.getSelection(true)
                const imageUrl = onImageUpload
                    ? await onImageUpload(file)
                    : await fileToDataUrl(file)

                const index = selection?.index ?? quill.getLength()
                quill.insertEmbed(index, 'image', imageUrl, 'user')
                quill.setSelection(index + 1, 0)
            }
        },
        [onImageUpload],
    )

    useEffect(() => {
        if (!containerRef.current || quillRef.current) {
            return
        }

        const toolbar = showImages
            ? {
                container: toolbarOptions(true),
                handlers: {
                    image: () => { void handleImageUpload(quill) },
                },
            }
            : { container: toolbarOptions(false) }

        const quill = new Quill(containerRef.current, {
            theme: 'snow',
            placeholder,
            modules: { toolbar },
        })

        quill.on('text-change', () => {
            onChange(quill.root.innerHTML)
            onJsonChange?.(quill.getContents())
        })

        if (value) {
            quill.clipboard.dangerouslyPasteHTML(value)
        }

        quillRef.current = quill
    }, [handleImageUpload, onChange,onJsonChange, placeholder, value])

    useEffect(() => {
        const quill = quillRef.current
        if (!quill) {
            return
        }

        const currentHtml = quill.root.innerHTML
        if (value === currentHtml) {
            return
        }

        if (!value) {
            quill.setText('')
            return
        }

        quill.clipboard.dangerouslyPasteHTML(value)
    }, [value])

    return <div className="quill-editor-wrapper" ref={containerRef} />
}

export default QuillEditor
