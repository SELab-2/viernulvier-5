import { getMessages } from '../../i18n'

/**
 * Public home page — displays the archive listing.
 */
function HomePage() {
    const messages = getMessages()

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    {messages.home.title}
                </h1>
                <p className="text-lg text-gray-600">
                    {messages.home.intro}
                </p>
                {/* TODO: Archive listing component */}
            </div>
        </main>
    )
}

export default HomePage
