type AdminLoginFormProps = {
    username: string
    password: string
    rememberMe: boolean
    error: string
    isSubmitting: boolean
    usernameLabel: string
    usernamePlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    rememberMeLabel: string
    submitLabel: string
    submittingLabel: string
    onUsernameChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRememberMeChange: (value: boolean) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[1.05rem] w-[1.05rem] text-slate-400">
            <path d="M4 6.5h16v11H4z" rx="2" />
            <path d="M5.5 8l6.5 5 6.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[1.05rem] w-[1.05rem] text-slate-400">
            <path d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2" strokeLinecap="round" />
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M12 14.5v2.5" strokeLinecap="round" />
        </svg>
    )
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function AdminLoginForm({
    username,
    password,
    rememberMe,
    error,
    isSubmitting,
    usernameLabel,
    usernamePlaceholder,
    passwordLabel,
    passwordPlaceholder,
    rememberMeLabel,
    submitLabel,
    submittingLabel,
    onUsernameChange,
    onPasswordChange,
    onRememberMeChange,
    onSubmit,
}: AdminLoginFormProps) {
    const isSubmitDisabled = isSubmitting || username.trim() === '' || password.trim() === ''

    return (
        <form onSubmit={onSubmit} className="admin-auth-card relative z-10 w-full max-w-[27.5rem] rounded-[0.75rem] bg-surface px-8 py-8 max-[640px]:px-5 max-[640px]:py-6">
            {error ? (
                <div className="mb-5 rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                    {error}
                </div>
            ) : null}

            <div className="space-y-6">
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">{usernameLabel}</span>
                    <span className="admin-auth-input">
                        <span className="admin-auth-input-icon">
                            <MailIcon />
                        </span>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(event) => onUsernameChange(event.target.value)}
                            placeholder={usernamePlaceholder}
                            className="admin-auth-field"
                            aria-label={usernameLabel}
                            required
                        />
                    </span>
                </label>

                <div className="block">
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">
                        {passwordLabel}
                    </label>
                    <span className="admin-auth-input">
                        <span className="admin-auth-input-icon">
                            <LockIcon />
                        </span>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            placeholder={passwordPlaceholder}
                            className="admin-auth-field"
                            aria-label={passwordLabel}
                            required
                        />
                    </span>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-muted">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => onRememberMeChange(event.target.checked)}
                        className="h-4 w-4 rounded-[0.25rem] border border-slate-300 text-black focus:ring-2 focus:ring-black/20"
                    />
                    <span>{rememberMeLabel}</span>
                </label>

                <button
                    type="submit"
                    className="admin-auth-submit"
                    disabled={isSubmitDisabled}
                >
                    <span>{isSubmitting ? submittingLabel : submitLabel}</span>
                    <ArrowIcon />
                </button>
            </div>
        </form>
    )
}

export default AdminLoginForm
