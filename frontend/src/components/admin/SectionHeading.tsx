type SectionHeadingProps = {
    title: string
    subTitle: string
}

function SectionHeading({title, subTitle}: SectionHeadingProps) {
    return (
        <section className="mx-4 mt-8 relative overflow-hidden ">
            <div className="px-4 py-4 text-2xl relative flex flex-col">
                <p className="text-3xl font-bold tracking-wide">
                    {title}
                </p>
                <p className="text-sm text-muted tracking-wide">
                    {subTitle}
                </p>
            </div>
        </section>
    )
}
export default SectionHeading