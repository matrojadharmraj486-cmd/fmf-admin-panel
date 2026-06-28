import { createTheme, alpha } from '@mui/material/styles'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 68

const lightPalette = {
  mode: 'light',
  primary: { light: '#787EFF', main: '#666CFF', dark: '#5A5FE0', contrastText: '#FFF' },
  secondary: { light: '#7F889B', main: '#6D788D', dark: '#606A7C', contrastText: '#FFF' },
  error: { light: '#FF625F', main: '#FF4D49', dark: '#E04440', contrastText: '#FFF' },
  warning: { light: '#FDBE42', main: '#FDB528', dark: '#DF9F23', contrastText: '#FFF' },
  info: { light: '#40CDFA', main: '#26C6F9', dark: '#21AEDB', contrastText: '#FFF' },
  success: { light: '#83E542', main: '#72E128', dark: '#64C623', contrastText: '#FFF' },
  background: { default: '#F4F5FA', paper: '#FFFFFF' },
  text: {
    primary: 'rgba(47,51,73,0.87)',
    secondary: 'rgba(47,51,73,0.68)',
    disabled: 'rgba(47,51,73,0.38)',
  },
  divider: 'rgba(47,51,73,0.12)',
}

const darkPalette = {
  mode: 'dark',
  primary: { light: '#787EFF', main: '#666CFF', dark: '#5A5FE0', contrastText: '#FFF' },
  secondary: { light: '#7F889B', main: '#6D788D', dark: '#606A7C', contrastText: '#FFF' },
  error: { light: '#FF625F', main: '#FF4D49', dark: '#E04440', contrastText: '#FFF' },
  warning: { light: '#FDBE42', main: '#FDB528', dark: '#DF9F23', contrastText: '#FFF' },
  info: { light: '#40CDFA', main: '#26C6F9', dark: '#21AEDB', contrastText: '#FFF' },
  success: { light: '#83E542', main: '#72E128', dark: '#64C623', contrastText: '#FFF' },
  background: { default: '#28243D', paper: '#312D4B' },
  text: {
    primary: 'rgba(231,227,252,0.87)',
    secondary: 'rgba(231,227,252,0.60)',
    disabled: 'rgba(231,227,252,0.38)',
  },
  divider: 'rgba(231,227,252,0.12)',
}

const getComponentOverrides = (mode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      '*, *::before, *::after': { boxSizing: 'border-box' },
      html: { height: '100%' },
      body: { height: '100%', fontFamily: "'Inter', sans-serif" },
      '#root': { height: '100%' },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: { textTransform: 'none', borderRadius: 8, fontWeight: 500 },
      sizeSmall: { padding: '4px 10px', fontSize: '0.8125rem' },
      sizeMedium: { padding: '6px 16px' },
      sizeLarge: { padding: '8px 22px' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        boxShadow: mode === 'dark'
          ? '0px 2px 6px 0px rgba(15,20,34,0.4)'
          : '0px 2px 6px 0px rgba(47,51,73,0.1)',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: { root: { padding: '1.25rem 1.5rem', '&:last-child': { paddingBottom: '1.25rem' } } },
  },
  MuiChip: {
    styleOverrides: { root: { borderRadius: 4, fontWeight: 500 } },
  },
  MuiPaper: {
    styleOverrides: { root: { borderRadius: 10 } },
  },
  MuiInputBase: {
    styleOverrides: { root: { fontSize: '0.875rem' } },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: { borderRadius: 8 },
      input: { padding: '10px 14px' },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.17px',
          textTransform: 'uppercase',
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(47,51,73,0.04)',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { borderBottomColor: mode === 'dark' ? 'rgba(231,227,252,0.12)' : 'rgba(47,51,73,0.12)' },
    },
  },
  MuiDialog: {
    styleOverrides: { paper: { borderRadius: 10, boxShadow: '0 5px 20px 0 rgba(0,0,0,0.3)' } },
  },
  MuiDialogTitle: {
    styleOverrides: { root: { padding: '1.25rem 1.5rem', fontSize: '1.125rem', fontWeight: 600 } },
  },
  MuiDialogContent: {
    styleOverrides: { root: { padding: '1rem 1.5rem' } },
  },
  MuiDialogActions: {
    styleOverrides: { root: { padding: '0.75rem 1.5rem 1.25rem' } },
  },
  MuiTab: {
    styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minWidth: 80 } },
  },
  MuiTooltip: {
    styleOverrides: { tooltip: { borderRadius: 6, fontSize: '0.75rem' } },
  },
  MuiTypography: {
    styleOverrides: { gutterBottom: { marginBottom: '0.5rem' } },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        paddingLeft: 12,
        paddingRight: 12,
        '&.Mui-selected': { fontWeight: 600 },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: { root: { borderRadius: 4 } },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        background: '#2F3349',
        borderRight: 'none',
        boxShadow: '0 0 20px 0 rgba(0,0,0,0.3)',
      },
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        backgroundColor: mode === 'dark' ? 'rgba(49,45,75,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(231,227,252,0.08)' : 'rgba(47,51,73,0.08)'}`,
        color: mode === 'dark' ? 'rgba(231,227,252,0.87)' : 'rgba(47,51,73,0.87)',
      },
    },
  },
  MuiSwitch: {
    defaultProps: { color: 'primary' },
    styleOverrides: {
      root: ({ theme }) => ({
        width: 40,
        height: 22,
        padding: 0,
        flexShrink: 0,
        '& .MuiSwitch-switchBase': {
          padding: 3,
          transition: 'transform 0.15s ease-in-out',
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
              opacity: 1,
            },
          },
        },
        '& .MuiSwitch-thumb': {
          width: 16,
          height: 16,
          borderRadius: '50%',
          boxShadow: 'none',
          backgroundColor: 'currentColor',
        },
        '& .MuiSwitch-track': {
          borderRadius: 11,
          backgroundColor: mode === 'dark' ? 'rgba(231,227,252,0.26)' : 'rgba(47,51,73,0.26)',
          opacity: 1,
        },
      }),
    },
  },
  MuiAvatar: {
    styleOverrides: { root: { fontWeight: 600 } },
  },
  MuiSelect: {
    styleOverrides: { select: { padding: '10px 14px' } },
  },
})

export function buildTheme(mode) {
  const palette = mode === 'dark' ? darkPalette : lightPalette
  return createTheme({
    palette,
    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: { fontWeight: 500, letterSpacing: '-1.5px' },
      h2: { fontWeight: 500, letterSpacing: '-0.5px' },
      h3: { fontWeight: 500, letterSpacing: '0px' },
      h4: { fontWeight: 500, letterSpacing: '0.25px' },
      h5: { fontWeight: 500, letterSpacing: '0px' },
      h6: { fontWeight: 500, letterSpacing: '0.15px' },
      subtitle1: { letterSpacing: '0.15px' },
      subtitle2: { letterSpacing: '0.1px' },
      body1: { letterSpacing: '0.15px' },
      body2: { lineHeight: 1.429, letterSpacing: '0.15px' },
      button: { letterSpacing: '0.3px' },
      caption: { letterSpacing: '0.4px' },
      overline: { letterSpacing: '1px', fontWeight: 500 },
    },
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    shape: { borderRadius: 10 },
    spacing: 4,
    shadows: Array(25).fill('none').map((_, i) =>
      i === 0 ? 'none' :
      i <= 2 ? `0px ${i}px ${i * 3}px rgba(47,51,73,0.${8 + i * 2})` :
      i <= 4 ? `0px ${i}px ${i * 2 + 2}px rgba(47,51,73,0.12)` :
      `0px ${Math.min(i, 12)}px ${Math.min(i * 2, 28)}px rgba(47,51,73,0.14)`
    ),
    components: getComponentOverrides(mode),
    custom: {
      sidebarWidth: SIDEBAR_WIDTH,
      sidebarCollapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
      sidebarBg: '#2F3349',
      sidebarActiveBg: alpha('#666CFF', 0.16),
      sidebarActiveColor: '#666CFF',
      sidebarTextColor: 'rgba(231,227,252,0.78)',
      sidebarTextColorMuted: 'rgba(231,227,252,0.50)',
      appBarHeight: 64,
    },
  })
}

export const SIDEBAR_WIDTH_PX = SIDEBAR_WIDTH
export const SIDEBAR_COLLAPSED_WIDTH_PX = SIDEBAR_COLLAPSED_WIDTH
