const adminWordmarkSrc = '/admin-wordmark.png'

type AdminFooterProps = {
    navigationTitle: string
    dashboardLabel: string
    productionsLabel: string
    statisticsLabel: string
    archiveLabel: string
    logoutLabel: string
    privacyLabel: string
    cookiesLabel: string
    disclaimerLabel: string
    rightsLabel: string
}

function AdminFooter({
    navigationTitle,
    dashboardLabel,
    productionsLabel,
    statisticsLabel,
    archiveLabel,
    logoutLabel,
    privacyLabel,
    cookiesLabel,
    disclaimerLabel,
    rightsLabel,
}: AdminFooterProps) {
    // Placeholder navigation until the CMS sections are wired to real routes.
    const navItems = [dashboardLabel, statisticsLabel, logoutLabel, productionsLabel, archiveLabel]

    return (
        <footer className="bg-black text-white">
            <div className="site-container py-8 max-[640px]:py-6">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-1">
                        <img src={adminWordmarkSrc} alt="VIERNULVIER" className="h-[1.6rem] w-auto shrink-0 object-contain" />
                    </div>

                    <section className="w-full max-w-xl md:max-w-2xl">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">{navigationTitle}</h2>
                        <div className="mt-4 grid justify-items-start text-sm text-white/80 min-[520px]:grid-cols-3">
                            {navItems.map((item) => (
                                <button key={item} type="button" className="text-left text-grey hover:text-white">{item}</button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-12 border-t border-white/10 pt-8 text-sm text-grey">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-6">
                        <button type="button" className="text-grey hover:text-white">{privacyLabel}</button>
                            <button type="button" className="text-grey hover:text-white">{cookiesLabel}</button>
                            <button type="button" className="text-grey hover:text-white">{disclaimerLabel}</button>
                        </div>
                        <p>{rightsLabel}</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default AdminFooter
