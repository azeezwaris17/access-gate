// theme.ts or lib/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  // Your theme configuration
  // Make sure there's no window, localStorage, or Date usage here
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  // Add any other theme configurations
});