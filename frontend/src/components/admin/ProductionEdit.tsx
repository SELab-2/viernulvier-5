type AdminProductionEditProps = {
    editTitle: string
    editSubTitle: string
}

function AdminProductionEdit({editTitle, editSubTitle}: AdminProductionEditProps) {
    return (
        <section className="relative overflow-hidden py-12 md:py-16">
            <div className="site-container relative flex flex-col">
                <p className="text-xl font-bold tracking-wide">
                    {editTitle}
                </p>
                <p className="text-sm tracking-wide">
                    {editSubTitle}
                </p>
            </div>
        </section>
    )
}

export default AdminProductionEdit
