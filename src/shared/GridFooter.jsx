const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function GridFooter({
  page,
  totalPages,
  pageSize,
  onPageSize,
  onPrev,
  onNext,
  onPageChange,
  canNext,
  totalItems,
  itemLabel = 'items'
}) {
  const safeTotalPages = totalPages || null
  const hasKnownTotal = Number.isFinite(Number(safeTotalPages))
  const disablePrev = page <= 1
  const disableNext = hasKnownTotal ? page >= safeTotalPages : !canNext
  const pageNumbers = hasKnownTotal
    ? Array.from({ length: safeTotalPages }).map((_, index) => index + 1)
    : []

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {hasKnownTotal ? `Page ${page} of ${safeTotalPages}` : `Page ${page}`}
        {typeof totalItems !== 'undefined' ? ` - ${totalItems} ${itemLabel}` : ''}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onPageSize ? (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value) || 10)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disablePrev}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
          >
            Prev
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange?.(pageNumber)}
              className={`rounded px-3 py-1.5 text-sm ${pageNumber === page ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={onNext}
            disabled={disableNext}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
