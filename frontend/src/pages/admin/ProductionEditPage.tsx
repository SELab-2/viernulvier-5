import AdminProductionContentTab from '../../components/admin/ProductionContentTab'
import AdminProductionEditProps from '../../components/admin/ProductionEdit'
import PublicLayout from '../../components/public/PublicLayout'
import { getMessages } from '../../i18n'

/**
 * Admin page for editing a pproduction item.
 */
function ProductionEditPage() {

    const messages = getMessages()

    return (
        // TODO: make a private layout for admins
        <PublicLayout
            title={messages.home.title}
            archiveLabel={messages.nav.archive}
            searchAriaLabel={messages.nav.searchAriaLabel}
            searchPlaceholder={messages.nav.searchPlaceholder}
        >
            <AdminProductionEditProps
                editTitle={messages.production.editTitle}
                editSubTitle={messages.production.editSubTitle}
            >
            </AdminProductionEditProps>

            <AdminProductionContentTab
                title={messages.production.title}
                slug={messages.production.slug}
                content={messages.production.content}
            >
            </AdminProductionContentTab>
            
             

        </PublicLayout>
    )
}

export default ProductionEditPage
