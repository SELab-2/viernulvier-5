import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import SectionTitle from '../../components/public/SectionTitle'
import { getActiveLocale, withLocalePath } from '../../i18n'

type BlogItem = {
    id: string
    title?: string | null
}

type BlogListResponse = {
    data: BlogItem[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

const PAGE_SIZE = 100

async function fetchAllBlogs(): Promise<BlogItem[]> {
    const firstResponse = await api.get<BlogListResponse>(`/archive/blogs?page=1&limit=${PAGE_SIZE}`)
    const blogs = [...firstResponse.data]

    for (let page = 2; page <= firstResponse.meta.totalPages; page += 1) {
        const response = await api.get<BlogListResponse>(`/archive/blogs?page=${page}&limit=${PAGE_SIZE}`)
        blogs.push(...response.data)
    }

    return blogs
}

function BlogsPage() {
    const [blogs, setBlogs] = useState<BlogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const locale = getActiveLocale(window.location.pathname)

    useEffect(() => {
        let isActive = true

        const loadBlogs = async () => {
            setIsLoading(true)
            setError('')

            try {
                const allBlogs = await fetchAllBlogs()

                if (isActive) {
                    setBlogs(allBlogs)
                }
            } catch (loadError) {
                if (isActive) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load blogs.')
                }
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        void loadBlogs()

        return () => {
            isActive = false
        }
    }, [])

    return (
        <PublicLayout>
            <section className="site-container py-12">
                <SectionTitle title="Blogs" subtitle="All blog titles from the database" />

                {isLoading ? <p className="text-center text-muted">Loading blogs...</p> : null}
                {error ? <p className="text-center text-red-500">{error}</p> : null}

                {!isLoading && !error ? (
                    blogs.length > 0 ? (
                        <ul className="mx-auto max-w-3xl space-y-3">
                            {blogs.map((blog) => (
                                <li key={blog.id}>
                                    <Link
                                        to={withLocalePath(`/blogs/${blog.id}`, locale)}
                                        className="block rounded-xl border border-border bg-surface px-5 py-4 text-lg text-foreground shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                                    >
                                        {blog.title?.trim() || 'Untitled blog'}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted">No blogs found.</p>
                    )
                ) : null}
            </section>
        </PublicLayout>
    )
}

export default BlogsPage