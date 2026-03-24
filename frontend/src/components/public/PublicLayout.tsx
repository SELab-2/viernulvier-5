import type { ReactNode } from 'react'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'

type PublicLayoutProps = {
    children: ReactNode
}

function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PublicNavbar />
            <main className="mx-auto w-full flex-1">{children}</main>
            <PublicFooter />
        </div>
    )
}

export default PublicLayout
