import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    black: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    midnight: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'black.900',
        color: 'midnight.100',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'black.800',
          borderColor: 'black.700',
          color: 'midnight.100',
          _hover: {
            borderColor: 'black.600',
          },
          _focus: {
            borderColor: 'brand.400',
            boxShadow: 'none',
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        bg: 'black.800',
        borderColor: 'black.700',
        color: 'midnight.100',
        _hover: {
          borderColor: 'black.600',
        },
        _focus: {
          borderColor: 'brand.400',
          boxShadow: 'none',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'black.800',
          borderColor: 'black.700',
          boxShadow: 'xl',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'black.800',
          borderColor: 'black.700',
        },
      },
    },
    Menu: {
      baseStyle: {
        menu: {
          bg: 'black.800',
          borderColor: 'black.700',
        },
      },
    },
  },
})

export default theme 