import {
  AppBar, Toolbar, IconButton, Box, Avatar,
  Tooltip, Menu, MenuItem, Divider, useTheme, alpha, Typography
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export function Topbar({ onMenuToggle, toggleMode, mode }) {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'

  const isDark = mode === 'dark'

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.85)
          : alpha('#FFFFFF', 0.85),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ px: { xs: 3, sm: 6 }, minHeight: '64px !important', gap: 1 }}>
        {/* Mobile Menu Button */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 1, display: { lg: 'none' }, color: 'text.secondary' }}
          aria-label="open menu"
        >
          <Icon icon="mdi:menu" fontSize={22} />
        </IconButton>

        {/* Search placeholder area */}
        <Box sx={{ flex: 1 }} />

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Dark/Light Mode Toggle */}
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
            >
              <Icon icon={isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'} fontSize={20} />
            </IconButton>
          </Tooltip>

          {/* Notifications placeholder */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
            >
              <Icon icon="mdi:bell-outline" fontSize={20} />
            </IconButton>
          </Tooltip>

          {/* User Avatar + Menu */}
          <Tooltip title="Account">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 2,
              '& .MuiMenuItem-root': { px: 2, py: 1.25, borderRadius: 1, mx: 0.5 },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user?.name || 'Admin'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'admin'}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => { setAnchorEl(null); logout() }}
            sx={{ color: 'error.main', gap: 1.5 }}
          >
            <Icon icon="mdi:logout-variant" fontSize={18} />
            <Typography variant="body2" fontWeight={500}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
