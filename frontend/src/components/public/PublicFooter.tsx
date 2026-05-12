import { Link, useLocation } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { usePublicMessages } from './PublicMessagesContext'

const PRIVACY_POLICY_URL = 'https://www.viernulvier.gent/nl/privacy-policy-zvg4'
const NEWSLETTER_URL = 'https://www.viernulvier.gent/nl/newsletter-inschrijven-q1lr'

const SOCIAL_LINKS = [
    {
        label: 'Facebook',
        href: 'https://www.facebook.com/VIERNULVIER.gent/',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M13.5 8.25V6.6c0-.57.46-1.03 1.03-1.03H16.5V3h-1.97A3.6 3.6 0 0 0 10.93 6.6v1.65H9v2.7h1.93V21h2.57v-10.05h2.26L16.1 8.25z" />
            </svg>
        ),
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/viernulvier.gent/',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        label: 'TikTok',
        href: 'https://www.tiktok.com/@viernulvier.gent',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M14.7 4.2c.73 1.06 1.78 1.76 3.1 2v2.65c-1.24-.06-2.35-.42-3.34-1.06v6.05A4.84 4.84 0 1 1 9.6 9v2.7a2.14 2.14 0 1 0 2.15 2.14V3h2.95z" />
            </svg>
        ),
    },
    {
        label: 'YouTube',
        href: 'https://www.youtube.com/channel/UCdRYlqUQcIm6pbLgHHobQcQ',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M21.2 8.3a2.9 2.9 0 0 0-2.05-2.05C17.38 5.8 12 5.8 12 5.8s-5.38 0-7.15.45A2.9 2.9 0 0 0 2.8 8.3c-.45 1.77-.45 3.7-.45 3.7s0 1.93.45 3.7a2.9 2.9 0 0 0 2.05 2.05c1.77.45 7.15.45 7.15.45s5.38 0 7.15-.45a2.9 2.9 0 0 0 2.05-2.05c.45-1.77.45-3.7.45-3.7s0-1.93-.45-3.7M10.3 15.45V8.55L15.9 12z" />
            </svg>
        ),
    },
    {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/company/viernulviergent',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M6.2 8.7H3.5V20h2.7zM4.85 3A1.85 1.85 0 1 0 4.9 6.7 1.85 1.85 0 0 0 4.85 3M20.5 13.2c0-3.1-1.66-4.55-3.88-4.55-1.79 0-2.59.98-3.03 1.67V8.7h-2.7V20h2.7v-6.16c0-1.62.3-3.2 2.31-3.2 1.99 0 2.02 1.86 2.02 3.3V20h2.7z" />
            </svg>
        ),
    },
] as const

function PublicFooter() {
    const location = useLocation()
    const locale = getActiveLocale(location.pathname)
    const messages = usePublicMessages()
    const homeUrl = withLocalePath('/', locale)

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
                            <li>
                                <a href={homeUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                                    {messages.footer.navHome}
                                </a>
                            </li>
                            <li><Link to={withLocalePath('/zoeken', locale)} className="text-left text-grey hover:text-white">{messages.footer.navArchiveSearch}</Link></li>
                            <li><Link to={withLocalePath('/blogs', locale)} className="text-left text-grey hover:text-white">{messages.footer.navBlogs}</Link></li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]">{messages.footer.contactTitle}</h3>
                        <address className="space-y-2 text-base not-italic text-grey">
                            <p>{messages.footer.organizationName}</p>
                            <p>{messages.footer.addressLine1}</p>
                            <p>{messages.footer.addressLine2}</p>
                            <p>{messages.footer.phone}</p>
                            <p>
                                <a href="mailto:info@viernulvier.gent" className="hover:text-white">{messages.footer.email}</a>
                            </p>
                            <p>{messages.footer.vatNumber}</p>
                        </address>
                    </section>

                    <section>
                        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]">{messages.footer.socialTitle}</h3>
                        <div className="mb-6 flex flex-wrap gap-2">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={social.label}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-grey transition-colors hover:border-white hover:text-white"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                        <a
                            href={NEWSLETTER_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                        >
                            {messages.footer.stayUpdatedCta}
                        </a>
                    </section>
                </div>

                <div className="mt-12 border-t border-white/10 pt-8 text-sm text-grey">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-6">
                            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer" className="text-grey hover:text-white">{messages.footer.privacyAndCookies}</a>
                        </div>
                        <p>{messages.footer.rights(new Date().getFullYear())}</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
