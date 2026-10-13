// Career Pilot Material 3 Theme Manager

export type ThemeMode = 'light' | 'dark';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  
  const saved = localStorage.getItem('cp_theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // System preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
  }

  try {
    localStorage.setItem('cp_theme', theme);
  } catch {
    // ignore
  }
}
