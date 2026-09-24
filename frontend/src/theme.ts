import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2f5d62' },
    secondary: { main: '#c98a3d' },
    background: { default: '#f7f8fa' },
  },
  shape: { borderRadius: 8 },
})
