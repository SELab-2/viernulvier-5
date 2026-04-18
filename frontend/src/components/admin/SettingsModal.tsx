import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { SessionUser } from '../../api/adminAuth'
import { api } from '../../api/client'
import { useAdminMessages } from './AdminMessagesContext'

type SettingsModalProps = {
    isOpen: boolean
    onClose: () => void
    user: SessionUser | null
    onUserUpdated?: (user: SessionUser) => void
}

type Tab = 'account' | 'editors'

type PasswordResetState = {
    isExpanded: boolean
    currentPassword: string
    newPassword: string
    confirmPassword: string
    error: string | null
    success: string | null
    isSubmitting: boolean
}

type AccountFormState = {
    username: string
    isSaving: boolean
    error: string | null
    success: string | null
}

type EditorEntry = {
    id: string
    username: string
    role: string
}

type EditorsResponse = {
    data: EditorEntry[]
}

type EditorMutationState = {
    username: string
    password: string
    isSubmitting: boolean
    error: string | null
    success: string | null
}

type EditorEditState = {
    username: string
    resetPassword: string
    isSaving: boolean
    isDeleting: boolean
    isResettingPassword: boolean
    error: string | null
    success: string | null
}

const INITIAL_PASSWORD_STATE: PasswordResetState = {
    isExpanded: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    error: null,
    success: null,
    isSubmitting: false,
}

function ModalOverlay({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
        />
    )
}

function CloseButton({ onClose, label }: { onClose: () => void; label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    )
}

type TabButtonProps = {
    label: string
    isActive: boolean
    onClick: () => void
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
    return (
        <button
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={onClick}
            className={[
                'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ].join(' ')}
        >
            {label}
        </button>
    )
}

type AccountTabProps = {
    user: SessionUser
    accountState: AccountFormState
    onAccountStateChange: (patch: Partial<AccountFormState>) => void
    onUserUpdated?: (user: SessionUser) => void
    passwordState: PasswordResetState
    onPasswordStateChange: (patch: Partial<PasswordResetState>) => void
    usernameId: string
}

function AccountTab({
    user,
    accountState,
    onAccountStateChange,
    onUserUpdated,
    passwordState,
    onPasswordStateChange,
    usernameId,
}: AccountTabProps) {
    const messages = useAdminMessages()
    const s = messages.settings
    const currentPasswordId = useId()
    const newPasswordId = useId()
    const confirmPasswordId = useId()

    async function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onAccountStateChange({ isSaving: true, error: null, success: null })

        try {
            const response = await api.patch<{ data: SessionUser }>('/auth/me', {
                username: accountState.username.trim(),
            })
            onAccountStateChange({
                username: response.data.username,
                isSaving: false,
                success: s.accountSavedSuccess,
                error: null,
            })
            onUserUpdated?.(response.data)
        } catch (error) {
            const message = error instanceof Error ? error.message : s.accountSaveError
            onAccountStateChange({ isSaving: false, error: message })
        }
    }

    async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (passwordState.newPassword !== passwordState.confirmPassword) {
            onPasswordStateChange({ error: s.passwordMismatchError })
            return
        }

        onPasswordStateChange({ isSubmitting: true, error: null, success: null })

        try {
            await api.patch('/auth/me', {
                currentPassword: passwordState.currentPassword,
                newPassword: passwordState.newPassword,
            })
            onPasswordStateChange({
                isSubmitting: false,
                isExpanded: false,
                success: s.passwordChangedSuccess,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                error: null,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : s.passwordChangeError
            onPasswordStateChange({ isSubmitting: false, error: message })
        }
    }

    return (
        <div className="space-y-6">
            {/* Profile section */}
            <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                    {s.accountSectionTitle}
                </h3>

                {accountState.success ? (
                    <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        {accountState.success}
                    </p>
                ) : null}

                {accountState.error ? (
                    <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {accountState.error}
                    </p>
                ) : null}

                <form onSubmit={handleAccountSubmit}>
                    <div className="rounded-xl border border-[var(--color-admin-card-border)] bg-slate-50 p-4 dark:bg-[#16191f]">
                        <label htmlFor={usernameId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {s.usernameLabel}
                        </label>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.usernameHint}</p>
                        <div className="mt-3 flex items-center gap-3">
                            <input
                                id={usernameId}
                                type="text"
                                value={accountState.username}
                                onChange={(event) => onAccountStateChange({ username: event.target.value, success: null, error: null })}
                                className="min-w-0 flex-1 rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white dark:placeholder:text-slate-500"
                                placeholder={user.username}
                            />
                            <button
                                type="submit"
                                disabled={accountState.isSaving || accountState.username.trim() === user.username}
                                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6e1dbf] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60"
                            >
                                {accountState.isSaving ? s.saving : s.saveButton}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            <div className="border-t border-[var(--color-admin-card-border)]" />

            {/* Security section */}
            <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                    {s.securitySectionTitle}
                </h3>

                {passwordState.success ? (
                    <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        {passwordState.success}
                    </p>
                ) : null}

                <div className="rounded-xl border border-[var(--color-admin-card-border)] bg-slate-50 dark:bg-[#16191f]">
                    {!passwordState.isExpanded ? (
                        <div className="flex items-center justify-between gap-4 p-4">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.changePasswordButton}</p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.securityHint}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onPasswordStateChange({ isExpanded: true, success: null, error: null })}
                                className="shrink-0 rounded-lg border border-[var(--color-admin-card-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:bg-[#1e2128] dark:text-slate-300 dark:hover:bg-slate-800/60"
                            >
                                {s.changePasswordButton}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 p-4">
                            {passwordState.error ? (
                                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                    {passwordState.error}
                                </p>
                            ) : null}

                            <div className="space-y-1.5">
                                <label htmlFor={currentPasswordId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {s.currentPasswordLabel}
                                </label>
                                <input
                                    id={currentPasswordId}
                                    type="password"
                                    value={passwordState.currentPassword}
                                    onChange={(event) => onPasswordStateChange({ currentPassword: event.target.value, error: null })}
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white dark:placeholder:text-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor={newPasswordId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {s.newPasswordLabel}
                                </label>
                                <input
                                    id={newPasswordId}
                                    type="password"
                                    value={passwordState.newPassword}
                                    onChange={(event) => onPasswordStateChange({ newPassword: event.target.value, error: null })}
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white dark:placeholder:text-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor={confirmPasswordId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {s.confirmPasswordLabel}
                                </label>
                                <input
                                    id={confirmPasswordId}
                                    type="password"
                                    value={passwordState.confirmPassword}
                                    onChange={(event) => onPasswordStateChange({ confirmPassword: event.target.value, error: null })}
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white dark:placeholder:text-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    aria-label={s.cancelButton}
                                    onClick={() => onPasswordStateChange({ ...INITIAL_PASSWORD_STATE })}
                                    className="rounded-lg border border-[var(--color-admin-card-border)] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                >
                                    {s.cancelButton}
                                </button>
                                <button
                                    type="submit"
                                    aria-label={s.savePasswordButton}
                                    disabled={passwordState.isSubmitting}
                                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6e1dbf] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                                >
                                    {passwordState.isSubmitting ? s.savingPassword : s.savePasswordButton}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </div>
    )
}

type EditorsTabProps = {
    isVisible: boolean
}

function EditorsTab({ isVisible }: EditorsTabProps) {
    const messages = useAdminMessages()
    const s = messages.settings

    const [state, setState] = useState<{ editors: EditorEntry[], isLoading: boolean, error: string | null }>({
        editors: [],
        isLoading: false,
        error: null,
    })
    const [createState, setCreateState] = useState<EditorMutationState>({
        username: '',
        password: '',
        isSubmitting: false,
        error: null,
        success: null,
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editState, setEditState] = useState<EditorEditState>({
        username: '',
        resetPassword: '',
        isSaving: false,
        isDeleting: false,
        isResettingPassword: false,
        error: null,
        success: null,
    })
    const createUsernameId = useId()
    const createPasswordId = useId()

    const [loadToken, setLoadToken] = useState(0)
    const [prevVisible, setPrevVisible] = useState(isVisible)

    if (prevVisible !== isVisible) {
        setPrevVisible(isVisible)
        if (isVisible) {
            setState((current) => ({ ...current, isLoading: true, error: null }))
            setLoadToken((token) => token + 1)
        }
    }

    useEffect(() => {
        if (!isVisible) {
            return
        }

        let isActive = true

        api.get<EditorsResponse>('/editors')
            .then((response) => {
                if (!isActive) {
                    return
                }
                setState({ editors: response.data, isLoading: false, error: null })
            })
            .catch(() => {
                if (!isActive) {
                    return
                }
                setState({ editors: [], isLoading: false, error: s.editorsLoadError })
            })

        return () => {
            isActive = false
        }
    }, [isVisible, loadToken, s.editorsLoadError])

    const selectedEditor = useMemo(
        () => state.editors.find((editor) => editor.id === editingId) ?? null,
        [editingId, state.editors],
    )

    function resetEditState(editor: EditorEntry | null) {
        setEditState({
            username: editor?.username ?? '',
            resetPassword: '',
            isSaving: false,
            isDeleting: false,
            isResettingPassword: false,
            error: null,
            success: null,
        })
    }

    function selectEditor(editor: EditorEntry) {
        setEditingId(editor.id)
        resetEditState(editor)
    }

    async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setCreateState((current) => ({ ...current, isSubmitting: true, error: null, success: null }))

        try {
            const response = await api.post<{ data: EditorEntry }>('/editors', {
                username: createState.username.trim(),
                password: createState.password,
            })
            setState((current) => ({
                ...current,
                editors: [...current.editors, response.data],
            }))
            setCreateState({
                username: '',
                password: '',
                isSubmitting: false,
                error: null,
                success: s.editorCreatedSuccess,
            })
            selectEditor(response.data)
        } catch (error) {
            const message = error instanceof Error ? error.message : s.editorCreateError
            setCreateState((current) => ({ ...current, isSubmitting: false, error: message }))
        }
    }

    async function handleEditorSave() {
        if (!selectedEditor) {
            return
        }

        setEditState((current) => ({ ...current, isSaving: true, error: null, success: null }))

        try {
            const response = await api.patch<{ data: EditorEntry }>(`/editors/${selectedEditor.id}`, {
                username: editState.username.trim(),
            })
            setState((current) => ({
                ...current,
                editors: current.editors.map((editor) => editor.id === response.data.id ? response.data : editor),
            }))
            setEditState((current) => ({ ...current, isSaving: false, success: s.editorSavedSuccess }))
        } catch (error) {
            const message = error instanceof Error ? error.message : s.editorSaveError
            setEditState((current) => ({ ...current, isSaving: false, error: message }))
        }
    }

    async function handlePasswordReset() {
        if (!selectedEditor) {
            return
        }

        setEditState((current) => ({ ...current, isResettingPassword: true, error: null, success: null }))

        try {
            await api.patch(`/editors/${selectedEditor.id}`, {
                password: editState.resetPassword,
            })
            setEditState((current) => ({
                ...current,
                resetPassword: '',
                isResettingPassword: false,
                success: s.editorPasswordResetSuccess,
            }))
        } catch (error) {
            const message = error instanceof Error ? error.message : s.editorPasswordResetError
            setEditState((current) => ({ ...current, isResettingPassword: false, error: message }))
        }
    }

    async function handleDelete() {
        if (!selectedEditor) {
            return
        }

        const confirmMessage = s.deleteEditorConfirm.replace('{username}', selectedEditor.username)
        const confirmed = window.confirm(confirmMessage)
        if (!confirmed) {
            return
        }

        setEditState((current) => ({ ...current, isDeleting: true, error: null, success: null }))

        try {
            await api.delete(`/editors/${selectedEditor.id}`)
            setState((current) => ({
                ...current,
                editors: current.editors.filter((editor) => editor.id !== selectedEditor.id),
            }))
            setEditingId(null)
            resetEditState(null)
        } catch (error) {
            const message = error instanceof Error ? error.message : s.editorDeleteError
            setEditState((current) => ({ ...current, isDeleting: false, error: message }))
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(16rem,0.95fr)_minmax(0,1.9fr)]">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                        {s.editorsSectionTitle}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {state.editors.length} accounts
                    </span>
                </div>

                {state.isLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{messages.common.loading}</p>
                ) : state.error ? (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {state.error}
                    </p>
                ) : state.editors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-admin-card-border)] py-10 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{s.noEditorsTitle}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                            {s.noEditorsHint}
                        </p>
                    </div>
                ) : (
                    <ul className="max-h-[23rem] overflow-y-auto rounded-xl border border-[var(--color-admin-card-border)]">
                        {state.editors.map((editor) => {
                            const isSelected = editor.id === editingId

                            return (
                                <li key={editor.id}>
                                    <button
                                        type="button"
                                        onClick={() => selectEditor(editor)}
                                        className={[
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                                            isSelected
                                                ? 'bg-slate-100 dark:bg-slate-800/80'
                                                : 'bg-white hover:bg-slate-50 dark:bg-[#111318] dark:hover:bg-slate-800/60',
                                        ].join(' ')}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                            {editor.username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{editor.username}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.clickToManageHint}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                            {editor.role}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            <section className="flex flex-col gap-5 rounded-2xl border border-[var(--color-admin-card-border)] bg-slate-50 p-5 dark:bg-[#16191f]">
                {/* Panel header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <div className="flex items-center gap-2">
                        {!selectedEditor ? (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-accent" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ) : null}
                        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                            {selectedEditor ? s.editEditorTitle : s.newEditorTitle}
                        </h3>
                    </div>
                    {selectedEditor ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null)
                                resetEditState(null)
                            }}
                            className="w-full rounded-lg border border-[var(--color-admin-card-border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 sm:w-auto sm:shrink-0 dark:bg-[#1e2128] dark:text-slate-300 dark:hover:bg-slate-800/60"
                        >
                            {s.addNewEditorButton}
                        </button>
                    ) : null}
                </div>

                {!selectedEditor ? (
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        {createState.success ? (
                            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                {createState.success}
                            </p>
                        ) : null}

                        {createState.error ? (
                            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                {createState.error}
                            </p>
                        ) : null}

                        <div className="space-y-1.5">
                            <label htmlFor={createUsernameId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {s.editorUsernameLabel}
                            </label>
                            <input
                                id={createUsernameId}
                                type="text"
                                value={createState.username}
                                onChange={(event) => setCreateState((current) => ({ ...current, username: event.target.value, success: null, error: null }))}
                                className="w-full rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={createPasswordId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {s.temporaryPasswordLabel}
                            </label>
                            <input
                                id={createPasswordId}
                                type="password"
                                value={createState.password}
                                onChange={(event) => setCreateState((current) => ({ ...current, password: event.target.value, success: null, error: null }))}
                                className="w-full rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.temporaryPasswordHint}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={createState.isSubmitting || !createState.username.trim() || createState.password.length < 6}
                            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6e1dbf] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60"
                        >
                            {createState.isSubmitting ? s.creatingEditor : s.createEditorButton}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-5">
                        {editState.success ? (
                            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                {editState.success}
                            </p>
                        ) : null}

                        {editState.error ? (
                            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                {editState.error}
                            </p>
                        ) : null}

                        {/* Username rename subsection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                                {s.editorUsernameLabel}
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    type="text"
                                    value={editState.username}
                                    onChange={(event) => setEditState((current) => ({ ...current, username: event.target.value, success: null, error: null }))}
                                    className="min-w-0 flex-1 rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleEditorSave()}
                                    disabled={editState.isSaving || editState.username.trim() === selectedEditor.username}
                                    className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6e1dbf] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 sm:w-auto sm:shrink-0"
                                >
                                    {editState.isSaving ? s.saving : s.saveUsernameButton}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[var(--color-admin-card-border)]" />

                        {/* Password reset subsection */}
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">{s.resetPasswordTitle}</p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.resetPasswordHint}</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    type="password"
                                    value={editState.resetPassword}
                                    onChange={(event) => setEditState((current) => ({ ...current, resetPassword: event.target.value, success: null, error: null }))}
                                    placeholder={s.resetPasswordPlaceholder}
                                    className="min-w-0 flex-1 rounded-lg border border-[var(--color-admin-input-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:bg-[#1e2128] dark:text-white dark:placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handlePasswordReset()}
                                    disabled={editState.isResettingPassword || editState.resetPassword.length < 6}
                                    className="w-full rounded-lg border border-[var(--color-admin-card-border)] bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/60 disabled:opacity-60 sm:w-auto sm:shrink-0"
                                >
                                    {editState.isResettingPassword ? s.resettingPassword : s.resetPasswordButton}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[var(--color-admin-card-border)]" />

                        {/* Danger zone */}
                        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">{s.dangerZoneTitle}</p>
                            <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-500/80">{s.dangerZoneHint}</p>
                            <button
                                type="button"
                                onClick={() => void handleDelete()}
                                disabled={editState.isDeleting}
                                className="mt-3 w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-60"
                            >
                                {editState.isDeleting ? s.deletingEditor : s.deleteEditorButton}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

function SettingsModal({ isOpen, onClose, user, onUserUpdated }: SettingsModalProps) {
    const messages = useAdminMessages()
    const s = messages.settings

    const [activeTab, setActiveTab] = useState<Tab>('account')
    const [passwordState, setPasswordState] = useState<PasswordResetState>(INITIAL_PASSWORD_STATE)
    const [accountState, setAccountState] = useState<AccountFormState>({
        username: user?.username ?? '',
        isSaving: false,
        error: null,
        success: null,
    })
    const dialogRef = useRef<HTMLDivElement>(null)
    const usernameId = useId()

    const isAdmin = user?.role === 'ADMIN'

    const [prevUserUsername, setPrevUserUsername] = useState(user?.username)
    if (user && prevUserUsername !== user.username) {
        setPrevUserUsername(user.username)
        setAccountState((current) => ({
            ...current,
            username: user.username,
        }))
    }

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen)
        if (!isOpen) {
            setActiveTab('account')
            setPasswordState(INITIAL_PASSWORD_STATE)
            setAccountState({
                username: user?.username ?? '',
                error: null,
                success: null,
                isSaving: false,
            })
        }
    }

    function handleUserUpdated(nextUser: SessionUser) {
        onUserUpdated?.(nextUser)
        setAccountState((current) => ({
            ...current,
            username: nextUser.username,
        }))
    }

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.focus()
        }
    }, [isOpen])

    if (!isOpen || !user) {
        return null
    }

    function handlePasswordStateChange(patch: Partial<PasswordResetState>) {
        setPasswordState((current) => ({ ...current, ...patch }))
    }

    function handleAccountStateChange(patch: Partial<AccountFormState>) {
        setAccountState((current) => ({ ...current, ...patch }))
    }

    return (
        <>
            <ModalOverlay onClose={onClose} />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={s.title}
                tabIndex={-1}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
            >
                <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--color-admin-card-border)] bg-white shadow-[var(--color-admin-shadow)] dark:bg-[#111318]">
                    <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-admin-card-border)] px-6 py-5">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{s.title}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {s.subtitle}
                            </p>
                        </div>
                        <CloseButton onClose={onClose} label={s.closeAriaLabel} />
                    </div>

                    <div className="shrink-0 border-b border-[var(--color-admin-card-border)] px-6 pt-2">
                        <div role="tablist" className="flex gap-6">
                            <TabButton
                                label={s.tabAccount}
                                isActive={activeTab === 'account'}
                                onClick={() => setActiveTab('account')}
                            />
                            {isAdmin ? (
                                <TabButton
                                    label={s.tabEditors}
                                    isActive={activeTab === 'editors'}
                                    onClick={() => setActiveTab('editors')}
                                />
                            ) : null}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                        {activeTab === 'account' ? (
                            <AccountTab
                                user={user}
                                accountState={accountState}
                                onAccountStateChange={handleAccountStateChange}
                                onUserUpdated={handleUserUpdated}
                                passwordState={passwordState}
                                onPasswordStateChange={handlePasswordStateChange}
                                usernameId={usernameId}
                            />
                        ) : (
                            <EditorsTab isVisible={activeTab === 'editors'} />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default SettingsModal
