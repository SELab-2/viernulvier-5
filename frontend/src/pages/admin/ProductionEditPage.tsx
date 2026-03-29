import AdminProductionContentTab from '../../components/admin/ProductionTabContent'
import AdminProductionEditProps from '../../components/admin/ProductionEdit'
import PublicLayout from '../../components/public/PublicLayout'
import { getMessages } from '../../i18n'
import ProductionEditHeader from '../../components/admin/ProductionEditHeader'
import { useNavigate } from 'react-router-dom'
import ProductionTab from '../../components/admin/ProductionTab'
import { useState } from 'react'

/**
 * Admin page for editing a pproduction item.
 */
function ProductionEditPage() {
    const messages = getMessages()
    const navigate = useNavigate()

    // TODO: for now this is fine but later we want maybe variable length language tabs...
    const [language, setLanguage] = useState('nl')

    const back = () => {
        navigate(-1)
    }
    
    const saveAsDraft = () => {
        // TODO: save as draft impl.
    }

    const publish = () => {
        // TODO: publish impl.
    }

    const setTab = (key: string) => {
        setLanguage(key)

        // TODO: proper impl 
    }

    return (
        // TODO: make a private layout for admins
        <PublicLayout
            title={messages.home.title}
            archiveLabel={messages.nav.archive}
            searchAriaLabel={messages.nav.searchAriaLabel}
            searchPlaceholder={messages.nav.searchPlaceholder}
        >   
            <ProductionEditHeader
                backText={messages.production.back}
                saveAsDraftText={messages.production.saveOnDraft}
                publishText={messages.production.publish}
                back={back}
                saveAsDraft={saveAsDraft}
                publish={publish}   
            />


            <AdminProductionEditProps
                editTitle={messages.production.editTitle}
                editSubTitle={messages.production.editSubTitle}
            >
            </AdminProductionEditProps>

            <ProductionTab
                setTab={setTab}
                language={language}
            >
            </ProductionTab>

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
