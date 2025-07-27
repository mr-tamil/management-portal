import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to system
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    let effectiveTheme: 'light' | 'dark'

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = theme
    }

    // Apply theme
    root.classList.add(effectiveTheme)
    setResolvedTheme(effectiveTheme)

    // Store in localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
        setResolvedTheme(systemTheme)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const toggleTheme = () => {
    if (resolvedTheme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return {
    theme: resolvedTheme,
    setTheme: setThemeMode,
    toggleTheme,
    actualTheme: theme // The actual setting (including 'system')
  }
}