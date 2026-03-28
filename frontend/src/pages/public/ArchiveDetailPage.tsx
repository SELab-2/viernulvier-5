import { useParams } from 'react-router-dom'

/**
 * Public archive detail page — shows a single archive item.
 */
function ArchiveDetailPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Archief Detail 
                </h1>
                <p className="text-gray-600">Item ID: {id}</p>
                {/* TODO: Fetch and display archive item */}
            </div>
        </main>
    )
}

export default ArchiveDetailPage
