import {
  Box, Typography, Select, MenuItem, FormControl, Pagination,
  InputLabel, useTheme
} from '@mui/material'

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
  const theme = useTheme()
  const safeTotalPages = totalPages || null
  const hasKnownTotal = Number.isFinite(Number(safeTotalPages))

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 3,
        py: 2,
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        borderRadius: '0 0 10px 10px',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {hasKnownTotal ? `Page ${page} of ${safeTotalPages}` : `Page ${page}`}
        {typeof totalItems !== 'undefined' ? ` · ${totalItems} ${itemLabel}` : ''}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        {onPageSize && (
          <FormControl size="small" variant="outlined">
            <InputLabel id="page-size-label" sx={{ fontSize: '0.8125rem' }}>Per page</InputLabel>
            <Select
              labelId="page-size-label"
              label="Per page"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value) || 10)}
              sx={{ fontSize: '0.8125rem', minWidth: 90 }}
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt} sx={{ fontSize: '0.8125rem' }}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {hasKnownTotal ? (
          <Pagination
            count={safeTotalPages}
            page={page}
            onChange={(_, p) => onPageChange?.(p)}
            shape="rounded"
            size="small"
            color="primary"
            siblingCount={1}
            boundaryCount={1}
          />
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              component="button"
              onClick={onPrev}
              disabled={page <= 1}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                color: 'text.primary',
                fontSize: '0.8125rem',
                cursor: page <= 1 ? 'default' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              Prev
            </Box>
            <Box
              component="button"
              onClick={onNext}
              disabled={!canNext}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                color: 'text.primary',
                fontSize: '0.8125rem',
                cursor: !canNext ? 'default' : 'pointer',
                opacity: !canNext ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              Next
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
