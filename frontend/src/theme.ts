import { createTheme, alpha } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5', light: '#818CF8', dark: '#3730A3', contrastText: '#fff' },
    secondary: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706', contrastText: '#fff' },
    success: { main: '#10B981', light: '#6EE7B7', dark: '#059669' },
    error: { main: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FDE68A', dark: '#D97706' },
    info: { main: '#06B6D4', light: '#67E8F9', dark: '#0891B2' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    text: { primary: '#1E293B', secondary: '#64748B' },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { color: '#64748B' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    ...Array(19).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        outlined: { borderColor: '#E2E8F0' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8FAFC',
            fontWeight: 600,
            color: '#475569',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': { backgroundColor: '#F8FAFC' },
          '&:hover': { backgroundColor: alpha('#4F46E5', 0.04) },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem' },
        colorSuccess: { backgroundColor: '#D1FAE5', color: '#065F46' },
        colorWarning: { backgroundColor: '#FEF3C7', color: '#92400E' },
        colorError: { backgroundColor: '#FEE2E2', color: '#991B1B' },
        colorInfo: { backgroundColor: '#CFFAFE', color: '#155E75' },
        colorPrimary: { backgroundColor: '#EDE9FE', color: '#4338CA' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8 },
        bar: { borderRadius: 8 },
      },
    },
    // DataGrid styles applied via sx on the component since MuiDataGrid
    // isn't in the base MUI component map (it's from @mui/x-data-grid).
  },
})
