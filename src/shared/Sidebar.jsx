import { NavLink, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Tooltip, IconButton, alpha
} from '@mui/material'
import { Icon } from '@iconify/react'
import { SIDEBAR_WIDTH_PX, SIDEBAR_COLLAPSED_WIDTH_PX } from '../theme/index.js'

const SIDEBAR_BG = '#2F3349'
const ACTIVE_BG = alpha('#666CFF', 0.16)
const ACTIVE_COLOR = '#666CFF'
const TEXT_COLOR = 'rgba(231,227,252,0.78)'
const TEXT_MUTED = 'rgba(231,227,252,0.50)'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'mdi:home-outline' },
  { to: '/users', label: 'Users', icon: 'mdi:account-multiple-outline' },
  { to: '/structured-questions', label: 'Questions', icon: 'mdi:help-circle-outline' },
  { to: '/banners', label: 'Banners', icon: 'mdi:image-multiple-outline' },
  { to: '/faqs', label: 'FAQ', icon: 'mdi:frequently-asked-questions' },
  { to: '/testimonials', label: 'Testimonials', icon: 'mdi:comment-quote-outline' },
  { to: '/orders', label: 'Orders', icon: 'mdi:shopping-outline' },
  { to: '/payment-gateway', label: 'Payment Gateway', icon: 'mdi:credit-card-outline' },
  { to: '/opinions', label: 'Opinions', icon: 'mdi:message-text-outline' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'mdi:card-account-details-outline' },
  { to: '/coupons', label: 'Coupons System', icon: 'mdi:ticket-percent-outline' },
  { to: '/notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
  { to: '/support-tickets', label: 'Support Tickets', icon: 'mdi:ticket-outline' },
]

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')

  const button = (
    <ListItemButton
      component={NavLink}
      to={item.to}
      onClick={onClick}
      sx={{
        borderRadius: '8px',
        mb: 0.5,
        px: collapsed ? 1.5 : 2,
        py: 1.25,
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: isActive ? ACTIVE_COLOR : TEXT_COLOR,
        bgcolor: isActive ? ACTIVE_BG : 'transparent',
        '&:hover': {
          bgcolor: isActive ? ACTIVE_BG : 'rgba(231,227,252,0.06)',
        },
        transition: 'all 0.2s',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 'auto' : 36,
          color: isActive ? ACTIVE_COLOR : TEXT_COLOR,
          fontSize: 20,
        }}
      >
        <Icon icon={item.icon} fontSize={20} />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? ACTIVE_COLOR : TEXT_COLOR,
            letterSpacing: '0.15px',
          }}
        />
      )}
    </ListItemButton>
  )

  if (collapsed) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <ListItem disablePadding sx={{ display: 'block' }}>
          {button}
        </ListItem>
      </Tooltip>
    )
  }

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      {button}
    </ListItem>
  )
}

function SidebarContent({ collapsed, onToggleCollapse, onClose }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: SIDEBAR_BG,
        overflow: 'hidden',
      }}
    >
      {/* Logo / Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 3,
          py: 3,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#666CFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:shield-crown-outline" color="#fff" fontSize={18} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(231,227,252,0.87)',
                fontWeight: 700,
                letterSpacing: '0.15px',
                fontSize: '1.125rem',
              }}
            >
              FMF Admin
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: '#666CFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:shield-crown-outline" color="#fff" fontSize={18} />
          </Box>
        )}
        {!collapsed && (
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_COLOR } }}
          >
            <Icon icon="mdi:chevron-left-circle-outline" fontSize={20} />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(231,227,252,0.08)', mx: collapsed ? 1 : 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 2, px: collapsed ? 0.5 : 1.5 }}>
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Tooltip title="Expand sidebar" placement="right" arrow>
              <IconButton
                size="small"
                onClick={onToggleCollapse}
                sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_COLOR } }}
              >
                <Icon icon="mdi:chevron-right-circle-outline" fontSize={20} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <List disablePadding>
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
          ))}
        </List>
      </Box>
    </Box>
  )
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse, isMobile }) {
  const drawerWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH_PX : SIDEBAR_WIDTH_PX

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH_PX,
            bgcolor: SIDEBAR_BG,
            border: 'none',
          },
        }}
      >
        <SidebarContent collapsed={false} onToggleCollapse={() => {}} onClose={onMobileClose} />
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: SIDEBAR_BG,
            border: 'none',
            overflowX: 'hidden',
            transition: 'width 0.25s ease',
            boxSizing: 'border-box',
          },
        }}
        open
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onClose={() => {}}
        />
      </Drawer>
    </>
  )
}
