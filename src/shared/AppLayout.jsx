import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { SIDEBAR_WIDTH_PX, SIDEBAR_COLLAPSED_WIDTH_PX } from '../theme/index.js'

export function AppLayout({ toggleMode, mode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH_PX : SIDEBAR_WIDTH_PX

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        isMobile={isMobile}
      />
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          ml: { lg: `${sidebarWidth}px` },
          transition: 'margin-left 0.25s ease',
        }}
      >
        <Topbar
          onMenuToggle={() => setMobileOpen((v) => !v)}
          toggleMode={toggleMode}
          mode={mode}
          sidebarWidth={sidebarWidth}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 4, sm: 6 },
            pt: { xs: 5, sm: 6 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
