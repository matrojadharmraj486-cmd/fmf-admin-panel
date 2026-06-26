import { Box, Skeleton } from '@mui/material'

export function Loader({ inline }) {
  return (
    <Box sx={{ width: '100%', py: inline ? 0 : 3 }}>
      <Skeleton variant="text" width="75%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="83%" height={20} />
    </Box>
  )
}
