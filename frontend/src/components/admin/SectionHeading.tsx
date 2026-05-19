type SectionHeadingProps = {
    title: string
    subTitle: string
}

function SectionHeading({title, subTitle}: SectionHeadingProps) {
    return (
        <section className="mx-4 mt-8 relative overflow-hidden ">
            <div className="px-4 py-4 text-2xl relative flex flex-col">
                <h2 className="text-3xl font-bold tracking-wide">
                    {title}
                </h2>
                <h3 className="text-sm text-muted tracking-wide">
                    {subTitle}
                </h3>
            </div>
        </section>
    )
}
export default SectionHeading