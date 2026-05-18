export type PageItem = number | 'ellipsis-left' | 'ellipsis-right'

type UsePaginationArgs = {
  page: number
  totalPages: number
  siblings?: number
  pageSize?: number
  totalItems?: number
}

type PaginationWindow = {
  items: PageItem[]
  from: number
  to: number
}

function getPaginationItems(current: number, totalPages: number, siblings = 1): PageItem[] {
  const pageNeighbours = siblings * 2 + 3
  const totalBlocks = pageNeighbours + 2

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblings, 2)
  const rightSibling = Math.min(current + siblings, totalPages - 1)
  const hasLeftGap = leftSibling > 2
  const hasRightGap = rightSibling < totalPages - 1

  const items: PageItem[] = [1]

  if (!hasLeftGap && hasRightGap) {
    const leftRange = Array.from({ length: pageNeighbours - 1 }, (_, i) => i + 2)
    items.push(...leftRange, 'ellipsis-right', totalPages)
    return items
  }

  if (hasLeftGap && !hasRightGap) {
    const rightRange = Array.from(
      { length: pageNeighbours - 1 },
      (_, i) => totalPages - (pageNeighbours - 2) + i,
    )
    items.push('ellipsis-left', ...rightRange)
    return items
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  )
  items.push('ellipsis-left', ...middleRange, 'ellipsis-right', totalPages)
  return items
}

export function usePagination({
  page,
  totalPages,
  siblings = 1,
  pageSize = 0,
  totalItems = 0,
}: UsePaginationArgs): PaginationWindow {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return {
    items: getPaginationItems(page, totalPages, siblings),
    from,
    to,
  }
}
