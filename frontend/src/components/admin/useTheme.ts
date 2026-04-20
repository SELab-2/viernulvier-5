import { useState } from 'react'
import type { Theme } from '../shared/TopBarControls'

function resolveTheme(): Theme {
  const explicitTheme = document.documentElement.dataset.theme
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

type UseThemeResult = {
  theme: Theme
  handleThemeChange: (nextTheme: Theme) => void
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(resolveTheme)

  const handleThemeChange = (nextTheme: Theme) => {
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  return { theme, handleThemeChange }
}
