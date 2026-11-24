import { useEffect, useState } from 'react'
import { detectLanguage, messages, type Language, type Theme } from '@/lib/i18n'

export function usePreferences() {
  const [language, setLanguage] = useState<Language>(() => detectLanguage(navigator.languages))
  const [theme, setTheme] = useState<Theme>('system')
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  const t = messages[language]

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#0a0a0a' : '#fafafa')
  }, [resolvedTheme])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = t.pageTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description)
  }, [language, t])

  return { language, setLanguage, theme, setTheme, t }
}
