type PublicPillButtonProps = {
    label: string
    icon?: React.ReactNode
    iconPosition?: 'left' | 'right'
    variant?: 'solid' | 'outline'
    type?: 'button' | 'submit' | 'reset'
    onClick?: () => void
    className?: string
}

function PublicPillButton({ label, icon, iconPosition = 'left', variant = 'solid', type = 'button', onClick, className = '' }: PublicPillButtonProps) {
    const baseClassName =
        'inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold lowercase tracking-wide transition'
    const variantClassName =
        variant === 'outline'
            ? 'border border-foreground text-foreground hover:bg-foreground hover:text-background'
            : 'border border-foreground bg-foreground text-background hover:bg-muted hover:text-background'

    return (
        <button type={type} onClick={onClick} className={`${baseClassName} ${variantClassName} ${className}`.trim()}>
            {icon && iconPosition === 'left' && icon}
            {label}
            {icon && iconPosition === 'right' && icon}
        </button>
    )
}

export default PublicPillButton
