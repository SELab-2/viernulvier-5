const adminWordmarkSrc = 'https://www.figma.com/api/mcp/asset/6e84969d-e20d-4ef0-a50a-5bcef7871037'

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
    adminLabel: string
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
    adminLabel,
}: AdminFooterProps) {
    // Placeholder navigation until the CMS sections are wired to real routes.
    const navItems = [dashboardLabel, statisticsLabel, logoutLabel, productionsLabel, archiveLabel]

    return (
        <footer className="bg-black text-white">
            <div className="site-container py-8 max-[640px]:py-6">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-1">
                        <img src={adminWordmarkSrc} alt="VIERNULVIER" className="h-[1.6rem] w-auto shrink-0 object-contain" />
                        <span className="pb-0.5 text-[0.95rem] font-medium uppercase tracking-[0.08em] text-white/85">
                            {adminLabel}
                        </span>
                    </div>

                    <section className="w-full max-w-xl md:max-w-2xl">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">{navigationTitle}</h2>
                        <div className="mt-4 grid gap-x-8 gap-y-2 text-sm text-white/80 min-[520px]:grid-cols-3">
                            {navItems.map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-4">
                        <span>{privacyLabel}</span>
                        <span>{cookiesLabel}</span>
                        <span>{disclaimerLabel}</span>
                    </div>
                    <p>{rightsLabel}</p>
                </div>
            </div>
        </footer>
    )
}

export default AdminFooter
