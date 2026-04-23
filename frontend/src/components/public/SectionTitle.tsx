type SectionTitleProps = {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
}

function SectionTitle({ title, subtitle, align = 'center' }: SectionTitleProps) {
    const alignmentClass = align === 'left' ? 'text-left' : 'text-center'

    return (
        <div className={`mb-10 ${alignmentClass}`}>
            <h2 className="text-4xl text-foreground">{title}</h2>
            {subtitle ? <p className="mt-2 text-md text-muted">{subtitle}</p> : null}
        </div>
    )
}

export default SectionTitle
