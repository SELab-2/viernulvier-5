import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import type { Messages } from '../../i18n/types'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLoginForm from '../../components/admin/AdminLoginForm'
import { getAdminRouteConfig } from '../../admin/paths'

const LOGIN_ERROR_KEYS = {
    invalidCredentials: 'invalidCredentials',
    rateLimitReached: 'rateLimitReached',
    loginFailed: 'loginFailed',
} as const

type LoginErrorKey = keyof typeof LOGIN_ERROR_KEYS

const adminIconSrc = '/admin-icon.svg'

type SessionUser = {
    sub: string
    username: string
    role: string
}

type SessionResponse = {
    user: SessionUser
}

function mapLoginError(message: string): LoginErrorKey {
    if (message === 'Invalid credentials') {
        return LOGIN_ERROR_KEYS.invalidCredentials
    }

    if (message === 'Too many login attempts') {
        return LOGIN_ERROR_KEYS.rateLimitReached
    }

    return LOGIN_ERROR_KEYS.loginFailed
}

function getLoginErrorMessage(errorKey: LoginErrorKey | null, messages: Messages) {
    if (!errorKey) {
        return ''
    }

    return messages.auth[errorKey]
}

function LoginPageContent() {
    const navigate = useNavigate()
    const location = useLocation()
    const messages = useAdminMessages()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [errorKey, setErrorKey] = useState<LoginErrorKey | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { dashboardPath } = getAdminRouteConfig(window.location.hostname)
    const from = (location.state as { from?: string } | null)?.from ?? dashboardPath

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorKey(null)
        setIsSubmitting(true)

        try {
            await api.post('/auth/login', {
                username: username.trim(),
                password,
            })
            await api.get<SessionResponse>('/auth/me')
            navigate(from, { replace: true })
        } catch (err) {
            const message = err instanceof Error ? err.message : ''
            setErrorKey(mapLoginError(message))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="w-full max-w-[27.5rem] text-center">
            <div
                className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl">
                <img src={adminIconSrc} alt="Admin icon" className="h-full w-full object-fill"/>
            </div>
            <div className="mb-10">
                <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-foreground max-[640px]:text-[1.75rem]">
                    {messages.auth.loginTitle}
                </h1>
                <p className="text-sm text-slate-500">{messages.auth.loginSubtitle}</p>
            </div>

            <AdminLoginForm
                username={username}
                password={password}
                rememberMe={rememberMe}
                error={getLoginErrorMessage(errorKey, messages)}
                isSubmitting={isSubmitting}
                usernameLabel={messages.auth.usernameLabel}
                usernamePlaceholder={messages.auth.usernamePlaceholder}
                passwordLabel={messages.auth.passwordLabel}
                passwordPlaceholder={messages.auth.passwordPlaceholder}
                rememberMeLabel={messages.auth.rememberMeLabel}
                submitLabel={messages.auth.submit}
                submittingLabel={messages.auth.submitting}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onRememberMeChange={setRememberMe}
                onSubmit={handleSubmit}
            />
        </section>
    )
}

/**
 * Admin login page.
 */
function LoginPage() {
    return (
        <AdminLayout mainClassName="flex flex-1 items-center justify-center px-4 py-16 max-[640px]:py-12">
            <LoginPageContent/>
        </AdminLayout>
    )
}

export default LoginPage
