import { useParams } from 'react-router-dom'

/**
 * Admin page for editing an archive item.
 */
function ArchiveEditPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <main className="min-h-screen bg-gray-100">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Archief Item Bewerken
                </h1>
                <p className="text-gray-600">Item ID: {id}</p>
                {/* TODO: Edit form */}
            </div>
        </main>
    )
}

export default ArchiveEditPage
