import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.jsx'
import './index.css'
import 'react-quill/dist/quill.snow.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { buildTheme } from './theme/index.js'

function Root() {
  const [mode, setMode] = useState(() => localStorage.getItem('fmf-theme') || 'light')

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('fmf-theme', next)
      return next
    })
  }

  const theme = buildTheme(mode)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <App toggleMode={toggleMode} mode={mode} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
