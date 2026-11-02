import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Keep the set awake for as long as the board is on it.
 *
 * A television is usually fine — it is a television — but a tablet propped on a
 * table dims itself after a minute and sleeps after two, which is a menu board
 * that goes black between customers. The wake lock is dropped by the browser
 * whenever the page is hidden (another tab, the home screen, the lid closing),
 * and the system can take it back at any time (a battery saver, a dimmed set),
 * so it is taken again whenever it goes and asked for again every minute after
 * a refusal: a board runs for weeks, and one early no should not last that long.
 *
 * Unsupported browsers and refused requests are not failures worth reporting:
 * the board simply behaves the way it did before the lock existed.
 */
export function useWakeLock(): void {
    useEffect(() => {
        const api = (
            navigator as Navigator & {
                wakeLock?: {
                    request: (kind: 'screen') => Promise<WakeSentinel>;
                };
            }
        ).wakeLock;

        if (api === undefined) {
            return;
        }

        let sentinel: WakeSentinel | null = null;
        let dropped = false;

        const take = async (): Promise<void> => {
            if (
                document.visibilityState !== 'visible' ||
                dropped ||
                sentinel !== null
            ) {
                return;
            }

            try {
                const held = await api.request('screen');

                sentinel = held;
                held.addEventListener('release', () => {
                    sentinel = null;
                    void take();
                });
            } catch {
                // Refused — a battery saver, a policy, an older implementation.
            }
        };

        void take();
        document.addEventListener('visibilitychange', take);
        const retry = window.setInterval(take, 60_000);

        return () => {
            dropped = true;
            window.clearInterval(retry);
            document.removeEventListener('visibilitychange', take);
            void sentinel?.release().catch(() => undefined);
        };
    }, []);
}

/** The part of the browser's wake lock this board uses. */
type WakeSentinel = {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
};

/**
 * Keep a tiny silent video looping for as long as the board is on the set.
 *
 * Most television browsers have no wake lock to ask for, but nearly all of them
 * treat a playing video as somebody watching, and hold off their screen saver
 * and their idle timers while one runs. It is a black square a pixel across,
 * barely a kilobyte, and it runs beside the wake lock rather than instead of it
 * because a set can offer the lock and then ignore it.
 *
 * It is nudged every so often, because a set that loses the picture for a moment
 * — an input change, a screen saver that did get through — leaves it paused with
 * nothing to start it again. A browser that wants a touch before it plays
 * anything gets one the first time somebody reaches for the set.
 *
 * This cannot beat a television's own power-off timer, which lives below the
 * browser and answers only to the set's settings menu.
 */
export function useAwakeVideo(): void {
    useEffect(() => {
        const video = document.createElement('video');

        video.src = '/cover/keep-awake.mp4';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('aria-hidden', 'true');
        video.style.cssText =
            'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0.01;pointer-events:none';

        document.body.appendChild(video);

        const play = (): void => {
            if (video.paused && document.visibilityState === 'visible') {
                void video.play().catch(() => undefined);
            }
        };

        play();

        const nudge = window.setInterval(play, 30_000);
        document.addEventListener('visibilitychange', play);
        window.addEventListener('pointerdown', play);
        window.addEventListener('keydown', play);

        return () => {
            window.clearInterval(nudge);
            document.removeEventListener('visibilitychange', play);
            window.removeEventListener('pointerdown', play);
            window.removeEventListener('keydown', play);
            video.remove();
        };
    }, []);
}

/**
 * Fetch the whole page again every so often, so a price changed in the
 * dashboard reaches a screen nobody is standing at.
 *
 * A hard reload rather than an Inertia visit, deliberately: a board runs for
 * weeks without anyone touching it, and this is what lets a deployed change to
 * the board itself land on the wall as well as a changed price.
 */
export function useTimedReload(minutes: number | null): void {
    useEffect(() => {
        if (minutes === null) {
            return;
        }

        const timer = window.setTimeout(
            () => window.location.reload(),
            minutes * 60_000,
        );

        return () => window.clearTimeout(timer);
    }, [minutes]);
}

/**
 * Step through a deck of pages, holding each for the same number of seconds.
 *
 * Returns the page showing and how far through its hold it is, from 0 to 1 —
 * the progress is what the bar across the foot of the board draws, and it is
 * what tells a customer halfway through reading a page that it is about to
 * turn.
 *
 * The clock is one interval rather than a timeout per page: a set left running
 * for a fortnight accumulates drift either way, and a single interval that
 * recomputes from a start time cannot wander off by more than one tick.
 */
export function useRotation(
    pages: number,
    holdSeconds: number,
): { index: number; progress: number } {
    const [state, setState] = useState({ pages, holdSeconds, index: 0 });
    const [progress, setProgress] = useState(0);

    // A changed deck starts again at its first page. Adjusted here rather than
    // in an effect: React takes a state update during render as "this state
    // described the old props", and re-renders before anything is painted.
    if (state.pages !== pages || state.holdSeconds !== holdSeconds) {
        setState({ pages, holdSeconds, index: 0 });
        setProgress(0);
    }

    useEffect(() => {
        if (pages < 2) {
            return;
        }

        const hold = Math.max(holdSeconds, 3) * 1000;
        let start = Date.now();

        // Twelve or so frames a second: enough that the bar reads as moving,
        // little enough that a cheap set is not repainting it constantly.
        const timer = window.setInterval(() => {
            const elapsed = Date.now() - start;

            if (elapsed >= hold) {
                start = Date.now();
                setProgress(0);
                setState((current) => ({
                    ...current,
                    index: (current.index + 1) % pages,
                }));

                return;
            }

            setProgress(elapsed / hold);
        }, 80);

        return () => window.clearInterval(timer);
    }, [pages, holdSeconds]);

    return {
        index: Math.min(state.index, Math.max(pages - 1, 0)),
        progress,
    };
}

/**
 * The wall clock, to the minute.
 *
 * A board that shows the time is a board you can tell at a glance is live —
 * the difference between a screen and a photograph of a screen. It also makes
 * a frozen set obvious from across the room, which on a television left running
 * for a month is the failure that actually happens.
 */
export function useClock(): string {
    const read = useCallback(
        (): string =>
            new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        [],
    );

    const [time, setTime] = useState(read);

    useEffect(() => {
        const timer = window.setInterval(() => setTime(read()), 15_000);

        return () => window.clearInterval(timer);
    }, [read]);

    return time;
}

/**
 * Whether the controls should be on screen: true for a few seconds after
 * somebody touches the set, false the rest of the time.
 *
 * A board has no business showing a fullscreen button to a room of customers,
 * but the person setting a tablet up needs one — and on a tablet there is no
 * other way into fullscreen, because the browser will only grant it inside a
 * real gesture. So the chrome comes back on a touch and leaves again on its
 * own, and the cursor goes with it.
 */
export function useIdleChrome(seconds = 4): boolean {
    const [awake, setAwake] = useState(false);

    useEffect(() => {
        let timer = 0;

        const wake = (): void => {
            setAwake(true);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setAwake(false), seconds * 1000);
        };

        window.addEventListener('pointermove', wake);
        window.addEventListener('pointerdown', wake);
        window.addEventListener('keydown', wake);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('pointermove', wake);
            window.removeEventListener('pointerdown', wake);
            window.removeEventListener('keydown', wake);
        };
    }, [seconds]);

    return awake;
}

/**
 * Put the page into fullscreen, or take it out again.
 *
 * Returns null where the browser has no fullscreen at all — an old smart
 * television, or an iPhone — so the button can be left out rather than drawn
 * as something that does nothing when pressed.
 */
export function useFullscreen(): {
    active: boolean;
    toggle: (() => void) | null;
} {
    // Read straight from the document rather than mirrored into state: the
    // browser is the one that knows, and it can leave fullscreen without
    // asking (Escape, a phone call, the set switching input).
    const active = useSyncExternalStore(
        (notify) => {
            document.addEventListener('fullscreenchange', notify);

            return () =>
                document.removeEventListener('fullscreenchange', notify);
        },
        () => document.fullscreenElement !== null,
        // Server-rendered, where there is no document and nothing is full of
        // anything yet.
        () => false,
    );

    const [supported] = useState(
        () =>
            typeof document !== 'undefined' &&
            document.documentElement.requestFullscreen !== undefined,
    );

    const toggle = useCallback((): void => {
        if (document.fullscreenElement === null) {
            void document.documentElement
                .requestFullscreen?.()
                .catch(() => undefined);

            return;
        }

        void document.exitFullscreen?.().catch(() => undefined);
    }, []);

    return { active, toggle: supported ? toggle : null };
}

/**
 * Whether the set is stood on its end right now, read off the set itself so a
 * board that measures its own room needs no telling and follows a tablet as it
 * is turned.
 */
export function useIsPortrait(): boolean {
    return useSyncExternalStore(
        (notify) => {
            const query = window.matchMedia('(orientation: portrait)');

            query.addEventListener('change', notify);

            return () => query.removeEventListener('change', notify);
        },
        () => window.matchMedia('(orientation: portrait)').matches,
        // Server-rendered, where there is no set to measure yet.
        () => false,
    );
}

/** Which sheet a board is drawn on. Dark is the default, and the usual answer. */
export type BoardTheme = 'dark' | 'light';

/** Where a set remembers the sheet it was left on. */
const THEME_KEY = 'stone-house-screen-theme';

/**
 * The board's own light/dark switch, remembered on the set itself.
 *
 * Deliberately not the storefront's theme: the person who picked the sheet on
 * the website is at home on their phone, and the screen on the wall is a
 * different object in a different room. A board over a bright counter reads
 * better dark; a tablet on a table in daylight reads better light, and the only
 * way to know which is to stand there and try it.
 *
 * Kept per device rather than per screen record, so two tablets showing the
 * same board can be set differently — and so changing it needs no round trip to
 * the dashboard while somebody is holding the set.
 */
export function useBoardTheme(): {
    theme: BoardTheme;
    toggle: () => void;
} {
    // Read once, lazily, rather than mirrored in from an effect. Storage can be
    // missing or walled up entirely, and this page is server-rendered, so both
    // are treated the same way: dark, which is the default anyway.
    const [theme, setTheme] = useState<BoardTheme>(() => {
        if (typeof window === 'undefined') {
            return 'dark';
        }

        try {
            const kept = window.localStorage.getItem(THEME_KEY);

            return kept === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });

    const toggle = useCallback((): void => {
        setTheme((current) => {
            const next = current === 'dark' ? 'light' : 'dark';

            try {
                window.localStorage.setItem(THEME_KEY, next);
            } catch {
                // The switch still works for as long as the set stays on.
            }

            return next;
        });
    }, []);

    return { theme, toggle };
}
