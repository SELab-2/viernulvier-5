type SectionTitleProps = {
    title: string
    subtitle?: string
}

function SectionTitle({ title, subtitle }: SectionTitleProps) {
    return (
        <div className="mb-10 text-center">
            <h2 className="text-4xl text-foreground">{title}</h2>
            {subtitle ? <p className="mt-2 text-md text-muted">{subtitle}</p> : null}
        </div>
    )
}

export default SectionTitle
