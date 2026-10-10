import { useCallback, useEffect, useState } from 'react';

/** The two sheets the storefront can be drawn on. */
export type Theme = 'light' | 'dark';

/**
 * Where the visitor's choice is kept. Deliberately theirs and not the shop's:
 * nothing here is stored on the server, so one customer reading in the dark
 * changes nothing for the next one.
 *
 * Not the older `stone-house-theme` key: that one was written on every visit,
 * so its `light` says nothing about whether anyone asked for it. This one is
 * only ever written by the switch.
 */
const STORAGE_KEY = 'stone-house-theme-choice';

/**
 * Dark unless the visitor has asked for otherwise — the OS preference is not
 * consulted. The shop's own sheet is the dark one; a light phone should not
 * decide that for everyone who walks in.
 */
const DEFAULT_THEME: Theme = 'dark';

/** The choice as it was left, or the default when there is nothing to read. */
export function storedTheme(): Theme {
    if (typeof window === 'undefined') {
        return DEFAULT_THEME;
    }

    return window.localStorage.getItem(STORAGE_KEY) === 'light'
        ? 'light'
        : DEFAULT_THEME;
}

/**
 * Paint the document in a theme. The class is what every `dark:` utility and
 * the whole dark token block key off; `color-scheme` carries the same choice to
 * the parts of the page the stylesheet does not own — scrollbars, form controls
 * and autofill.
 */
export function applyTheme(theme: Theme): void {
    const root = document.documentElement;

    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
}

/**
 * The current theme and a way to change it.
 *
 * The first value is read off the document rather than storage, because the
 * inline script in the root template has already applied the stored choice by
 * the time React runs — reading storage again would be a second answer to a
 * question already settled, and any disagreement would show as a flash.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
    const [theme, setTheme] = useState<Theme>(() =>
        typeof document === 'undefined'
            ? DEFAULT_THEME
            : document.documentElement.classList.contains('dark')
              ? 'dark'
              : 'light',
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';

        setTheme(next);

        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage can be off or walled up; the switch still works for
            // this visit.
        }
    }, [theme]);

    return { theme, toggleTheme };
}
