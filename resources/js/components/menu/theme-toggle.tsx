import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * The visitor's own light/dark switch, standing next to the nav trigger.
 *
 * One button rather than two: there are only two sheets, so the icon shows the
 * one it would take you to and pressing it goes there. The choice is the
 * reader's and is remembered on their device — the shop is not consulted, and
 * nobody else's menu changes with it.
 *
 * Both icons are drawn on top of each other and swapped by transform, so the
 * button never changes size and the change reads as one mark turning into the
 * other rather than as a flicker.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? 'Switch to light menu' : 'Switch to dark menu'}
            title={isDark ? 'Light menu' : 'Dark menu'}
            className={cn(
                'relative grid size-9 place-items-center rounded-lg text-primary transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                className,
            )}
        >
            <Sun
                aria-hidden
                strokeWidth={3}
                className={cn(
                    'col-start-1 row-start-1 size-7 transition-all duration-300 ease-out motion-reduce:transition-none',
                    isDark
                        ? 'scale-100 rotate-0 opacity-100'
                        : 'scale-50 -rotate-90 opacity-0',
                )}
            />

            <Moon
                aria-hidden
                strokeWidth={3}
                className={cn(
                    'col-start-1 row-start-1 size-7 transition-all duration-300 ease-out motion-reduce:transition-none',
                    isDark
                        ? 'scale-50 rotate-90 opacity-0'
                        : 'scale-100 rotate-0 opacity-100',
                )}
            />
        </button>
    );
}
