import { useState, useMemo, useEffect } from 'react'

/**
 * Client-side pagination over an already-filtered list.
 *
 * The page is clamped rather than reset when `items` shrinks, so narrowing a
 * filter while on page 7 lands you on the last page that still has rows
 * instead of an empty table.
 */
export default function usePagination(items, initialPageSize = 25) {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(initialPageSize)

    const total = items?.length ?? 0
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, pageCount)

    // Keep state in step when the caller's filters change the row count.
    useEffect(() => {
        if (page > pageCount) setPage(pageCount)
    }, [page, pageCount])

    const pageItems = useMemo(
        () => (items || []).slice((current - 1) * pageSize, current * pageSize),
        [items, current, pageSize],
    )

    const changePageSize = (size) => {
        // Keep the first visible row visible across a page-size change.
        const firstRow = (current - 1) * pageSize
        setPageSize(size)
        setPage(Math.floor(firstRow / size) + 1)
    }

    return {
        page: current,
        setPage,
        pageSize,
        setPageSize: changePageSize,
        pageCount,
        pageItems,
        total,
        from: total === 0 ? 0 : (current - 1) * pageSize + 1,
        to: Math.min(current * pageSize, total),
    }
}
