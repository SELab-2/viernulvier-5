import type { ReactNode } from 'react'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'

type PublicLayoutProps = {
    title: string
    archiveLabel: string
    searchAriaLabel: string
    searchPlaceholder: string
    children: ReactNode
}

function PublicLayout({ title, archiveLabel, searchAriaLabel, searchPlaceholder, children }: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PublicNavbar
                title={title}
                archiveLabel={archiveLabel}
                searchAriaLabel={searchAriaLabel}
                searchPlaceholder={searchPlaceholder}
            />
            <main className="mx-auto w-full flex-1 py-8">{children}</main>
            <PublicFooter />
        </div>
    )
}

export default PublicLayout
