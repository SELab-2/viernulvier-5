import { useParams } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'

/**
 * Public archive detail page — shows a single archive item.
 */
function ArchiveDetailPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <PublicLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Archief Detail
                </h1>
                <p className="text-gray-600">Item ID: {id}</p>
                {/* TODO: Fetch and display archive item */}
            </div>
        </PublicLayout>
    )
}

export default ArchiveDetailPage
