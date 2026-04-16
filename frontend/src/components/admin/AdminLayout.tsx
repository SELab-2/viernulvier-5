import type { ReactNode } from 'react'

// TODO: for now these are public, make or use private/admin navbar and footer
import PublicNavbar from './../public/PublicNavbar'
import PublicFooter from './../public/PublicFooter'
import ProductionSidebar from './ProductionSidebar'
import ProductionEditHeader from './ProductionEditHeader'
import EventsEdit from './ManageEvents'

type AdminLayoutProps = {
    title: string
    productionSettingsLabel: string,
    archiveLabel: string
    searchAriaLabel: string
    searchPlaceholder: string
    statusLabel: string
    genreLabel: string
    bannerLabel: string
    extraPicturesLabel: string
    artistLabel: string
    backLabel: string
    saveAsDraftLabel: string
    publishLabel: string
    back: () => void
    saveAsDraft: () => void
    publish: () => void
    children: ReactNode
}

function AdminLayout({ 
    title,
    productionSettingsLabel,
    archiveLabel, 
    searchAriaLabel, 
    searchPlaceholder, 
    statusLabel,
    genreLabel,
    bannerLabel,
    extraPicturesLabel,
    artistLabel,
    backLabel,
    saveAsDraftLabel,
    publishLabel,
    back,
    saveAsDraft,
    publish,
    children 
}: AdminLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <PublicNavbar
                title={title}
                archiveLabel={archiveLabel}
                searchAriaLabel={searchAriaLabel}
                searchPlaceholder={searchPlaceholder}
            />
            <ProductionEditHeader
                backLabel={backLabel}
                saveAsDraftLabel={saveAsDraftLabel}
                publishLabel={publishLabel}
                back={back}
                saveAsDraft={saveAsDraft}
                publish={publish}   
            />
            <div className="flex flex-row">
                <main className="mx-auto w-full flex-1">{children}</main>
                <ProductionSidebar
                    productionSettingsLabel={productionSettingsLabel}
                    statusLabel={statusLabel}
                    genreLabel={genreLabel}
                    bannerLabel={bannerLabel}
                    extraPicturesLabel={extraPicturesLabel}
                    artistLabel={artistLabel}
                />
            </div>
            <PublicFooter />
        </div>
    )
}

export default AdminLayout
