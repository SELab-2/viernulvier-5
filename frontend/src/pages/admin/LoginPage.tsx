import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import type { Messages } from '../../i18n/types'
import AdminLayout, { useAdminMessages } from '../../components/admin/AdminLayout'
import AdminLoginForm from '../../components/admin/AdminLoginForm'
import { getAdminRouteConfig } from '../../admin/paths'

const adminIconSrc = 'https://www.figma.com/api/mcp/asset/7d7b314a-5913-42fe-8b3f-649880903461'

type SessionUser = {
    sub: string
    username: string
    role: string
}

type SessionResponse = {
    user: SessionUser
}

function mapLoginError(message: string, messages: Messages) {
    if (message === 'Invalid credentials') {
        return messages.auth.invalidCredentials
    }

    if (message === 'Too many login attempts') {
        return messages.auth.rateLimitReached
    }

    return messages.auth.loginFailed
}

function LoginPageContent() {
    const navigate = useNavigate()
    const messages = useAdminMessages()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { dashboardPath } = getAdminRouteConfig(window.location.hostname)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            await api.post('/auth/login', {
                username: username.trim(),
                password,
            })
            await api.get<SessionResponse>('/auth/me')
            navigate(dashboardPath)
        } catch (err) {
            const message = err instanceof Error ? err.message : ''
            setError(mapLoginError(message, messages))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="w-full max-w-[27.5rem] text-center">
            <div className="mx-auto mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-black shadow-[0_20px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.12)]">
                <img src={adminIconSrc} alt="Admin icon" className="h-[1.7rem] w-[1.7rem] object-contain" />
            </div>
            <div className="mb-10 space-y-1.5">
                <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-foreground max-[640px]:text-[1.75rem]">
                    {messages.auth.loginTitle}
                </h1>
                <p className="text-sm text-slate-500">{messages.auth.loginSubtitle}</p>
            </div>

            <AdminLoginForm
                username={username}
                password={password}
                rememberMe={rememberMe}
                error={error}
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
            <LoginPageContent />
        </AdminLayout>
    )
}

export default LoginPage
