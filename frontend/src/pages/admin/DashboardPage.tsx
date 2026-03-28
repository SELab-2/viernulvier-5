import { getMessages } from "../../i18n"
import PublicLayout from "../../components/public/PublicLayout"

/**
 * Admin dashboard — overview of archive management.
 */
function DashboardPage() {
    const messages = getMessages()
    return (
        <PublicLayout
            title={messages.home.title}
            archiveLabel={messages.nav.archive}
            searchAriaLabel={messages.nav.searchAriaLabel}
            searchPlaceholder={messages.nav.searchPlaceholder}
        >   
            {/* TODO: add private navbar */}


            {/* TODO: add private footer */}
        </PublicLayout>
    )
}

export default DashboardPage
