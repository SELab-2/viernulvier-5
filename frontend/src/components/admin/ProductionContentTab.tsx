type AdminProductionContentTabProps = {
    title: string
    slug: string
    content: string
}

function AdminProductionContentTab({title, slug, content}: AdminProductionContentTabProps) {
    return (
        <section className="relative overflow-hidden py-12 md:py-16">
            <div className="site-container relative flex flex-col">
                <form
                    // onSubmit={}
                    className="w-full max-w-xl rounded-xl border border-border bg-surface p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:max-w-none"
                >
                    <p className="text-sm font-bold tracking-wide">
                        {title}
                    </p>
                    <div className="mb-8 grid gap-2 md:grid-cols-[1.8fr_auto_auto_auto_auto] md:items-center">
                        <div className="col-span-full flex h-12 items-center rounded-md bg-background px-4 text-muted md:col-span-1">
                            <input
                                type="text"
                                // value={}
                                // onChange={(event) => setQuery(event.target.value)}
                                // placeholder={}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>
                    <p className="text-sm font-bold tracking-wide">
                        {slug}
                    </p>
                    <div className="mb-8 grid gap-2 md:grid-cols-[1.8fr_auto_auto_auto_auto] md:items-center">
                        <div className="col-span-full flex h-12 items-center rounded-md bg-background px-4 text-muted md:col-span-1">
                            <input
                                type="text"
                                // value={}
                                // onChange={(event) => setQuery(event.target.value)}
                                // placeholder={}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>
                    <p className="text-sm font-bold tracking-wide">
                        {content}
                    </p>
                    <div className="mb-8 grid gap-2 md:grid-cols-[1.8fr_auto_auto_auto_auto] md:items-center">
                        <div className="col-span-full flex h-12 items-center rounded-md bg-background px-4 text-muted md:col-span-1">
                            <input
                                type="text"
                                // value={}
                                // onChange={(event) => setQuery(event.target.value)}
                                // placeholder={}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default AdminProductionContentTab
