type SectionTitleProps = {
    title: string
    subtitle?: string
    align?: 'center' | 'left'
}

function SectionTitle({ title, subtitle, align = 'center' }: SectionTitleProps) {
    const textAlign = align === 'left' ? 'text-left' : 'text-center'
    return (
        <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-4xl text-foreground">{title}</h2>
            {subtitle ? <p className="mt-2 text-md text-muted">{subtitle}</p> : null}
        </div>
    )
}

export default SectionTitle
