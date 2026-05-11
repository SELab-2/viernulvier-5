import { useAdminMessages } from './AdminMessagesContext'

const adminWordmarkSrc = '/admin/admin-wordmark.png'

function AdminFooter() {
  const messages = useAdminMessages()

  // Placeholder navigation until the CMS sections are wired to real routes.
  const navItems = [
    messages.auth.dashboardLabel,
    messages.auth.statisticsLabel,
    messages.auth.productionsLabel,
    messages.auth.archiveLabel,
  ]

  const footerLinks = [messages.footer.privacy, messages.footer.cookies, messages.footer.disclaimer]

  return (
    <footer className="bg-black text-white">
      <div className="site-container py-8 max-[640px]:py-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-1">
            <img src={adminWordmarkSrc} alt={messages.common.brandLogoAlt} className="h-[1.6rem] w-auto shrink-0 object-contain" />
          </div>

          <section className="w-full max-w-xl md:max-w-2xl">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">{messages.auth.navigationTitle}</h2>
            <div className="mt-4 grid justify-items-start text-sm text-white/80 min-[520px]:grid-cols-3">
              {navItems.map((item) => (
                <span key={item} className="text-left text-grey">{item}</span>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-sm text-grey">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-6">
              {footerLinks.map((item) => (
                <span key={item} className="text-grey">{item}</span>
              ))}
            </div>
            <p>{messages.footer.rights.replace('{year}', String(new Date().getFullYear()))}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default AdminFooter
