type DeleteConfirmModalProps = {
    isOpen: boolean
    title: string
    message: string
    isDeleting?: boolean
    onCancel: () => void
    onConfirm: () => void
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

function CloseButton({
                         onClose,
                         label,
                     }: {
    onClose: () => void
    label: string
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
            >
                <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

function DeleteConfirmModal({
                                isOpen,
                                title,
                                message,
                                isDeleting = false,
                                onCancel,
                                onConfirm,
                            }: DeleteConfirmModalProps) {
    if (!isOpen) {
        return null
    }

    return (
        <>
            <ModalOverlay onClose={onCancel} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-[var(--color-admin-card-border)] bg-white shadow-[var(--color-admin-shadow)] dark:bg-[#111318]">

                    <div className="flex items-center justify-between border-b border-[var(--color-admin-card-border)] px-6 py-5">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>

                        <CloseButton
                            onClose={onCancel}
                            label="Close"
                        />
                    </div>

                    <div className="px-6 py-5">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {message}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[var(--color-admin-card-border)] px-6 py-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-[var(--color-admin-card-border)] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}

export default DeleteConfirmModal