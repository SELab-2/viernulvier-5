import { Link, useLocation } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { usePublicMessages } from './PublicMessagesContext'

function PublicFooter() {
    const location = useLocation()
    const locale = getActiveLocale(location.pathname)
    const messages = usePublicMessages()

    return (
        <footer className="bg-black text-white z-50">
            <div className="site-container py-14">
                <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4">
                    <section>
                        <img src="/logo-white.png" alt={messages.footer.brandLogoAlt} className="mb-5 h-10 w-auto" />
                        <p className="max-w-xs text-base leading-7 text-grey">
                            {messages.footer.about}
                        </p>
                    </section>

                    <section>
                        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]">{messages.footer.navigationTitle}</h3>
                        <ul className="space-y-2 text-base text-grey">
                            <li><Link to={withLocalePath('/', locale)} className="hover:text-white">{messages.footer.navHome}</Link></li>
                            <li><button type="button" className="text-left text-grey hover:text-white">{messages.footer.navAgenda}</button></li>
                            <li><Link to={withLocalePath('/zoeken', locale)} className="text-left text-grey hover:text-white">{messages.footer.navArchiveSearch}</Link></li>
                            <li><button type="button" className="text-left text-grey hover:text-white">{messages.footer.navAbout}</button></li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]">{messages.footer.contactTitle}</h3>
                        <address className="space-y-2 text-base not-italic text-grey">
                            <p>Sint-Pietersnieuwstraat 23</p>
                            <p>9000 Gent</p>
                            <p>info@viernulvier.gent</p>
                            <p>+32 (0)9 267 28 20</p>
                            <p>{messages.footer.organizationName}</p>
                            <p>BTW BE 0423.063.619</p>
                        </address>
                    </section>

                    <section>
                        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]">{messages.footer.newsletterTitle}</h3>
                        <p className="mb-5 max-w-xs text-base leading-7 text-grey">
                            {messages.footer.newsletterText}
                        </p>
                        <form className="grid max-w-sm grid-cols-1 gap-2 min-[1400px]:grid-cols-[1fr_auto]">
                            <input
                                type="email"
                                placeholder={messages.footer.newsletterPlaceholder}
                                className="h-10 min-w-0 rounded-md bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-400"
                            />
                            <button type="submit" className="h-10 w-full rounded-md bg-white px-5 text-sm font-semibold text-zinc-900 min-[1400px]:w-auto">
                                {messages.footer.newsletterSubmit}
                            </button>
                        </form>
                    </section>
                </div>

                <div className="mt-12 border-t border-white/10 pt-8 text-sm text-grey">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-6">
                            <button type="button" className="text-grey hover:text-white">{messages.footer.privacy}</button>
                            <button type="button" className="text-grey hover:text-white">{messages.footer.cookies}</button>
                            <button type="button" className="text-grey hover:text-white">{messages.footer.disclaimer}</button>
                        </div>
                        <p>{messages.footer.rights}</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
