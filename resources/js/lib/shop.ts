import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import type { OpeningHours, Shop } from '@/types/shop';

/** Days in reading order — Monday first — and names indexed by `getDay()`. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

/** How often the automatic schedule is re-checked, in milliseconds. */
const TICK_MS = 30_000;

/** Minutes since midnight for a `HH:mm` time. */
function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + (minutes ?? 0);
}

/**
 * Whether `minutesNow` falls inside one day's hours. `fromYesterday` marks a
 * row belonging to the previous day, which can only still be running if its
 * session crosses midnight.
 */
function isWithinHours(
    hours: OpeningHours | undefined,
    minutesNow: number,
    fromYesterday: boolean,
): boolean {
    if (!hours || hours.isClosed) {
        return false;
    }

    const opensAt = toMinutes(hours.opensAt);
    const closesAt = toMinutes(hours.closesAt);
    // A closing time at or before the opening time closes the next day —
    // open 18:00, close 02:00.
    const crossesMidnight = closesAt <= opensAt;

    if (fromYesterday) {
        return crossesMidnight && minutesNow <= closesAt;
    }

    return crossesMidnight
        ? minutesNow >= opensAt
        : minutesNow >= opensAt && minutesNow <= closesAt;
}

/**
 * Whether the shop is open, resolving its status mode. Mirrors the server's
 * `GeneralSettings::isCurrentlyOpen()` so the schedule can turn over without a
 * page reload. Pass `now` to ask about another moment.
 */
export function isShopOpen(shop: Shop, now: Date = new Date()): boolean {
    if (shop.statusMode === 'manual') {
        return shop.isManuallyOpen;
    }

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const byDay = new Map(shop.openingHours.map((hours) => [hours.day, hours]));
    const yesterday = (now.getDay() + 6) % 7;

    return (
        isWithinHours(byDay.get(now.getDay()), minutesNow, false) ||
        isWithinHours(byDay.get(yesterday), minutesNow, true)
    );
}

/** The full weekday name for a `Date.getDay()` index. */
export function dayName(day: number): string {
    return FULL_DAYS[day];
}

/** A `HH:mm` time as a friendly 12-hour string, e.g. "9:00 AM". */
export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    return `${hour12}:${String(minutes ?? 0).padStart(2, '0')} ${period}`;
}

/**
 * The next moment the shop opens, scanning today and the week ahead. Null in
 * manual mode, or when no day of the schedule opens at all.
 */
export function nextOpening(shop: Shop, now: Date = new Date()): Date | null {
    if (shop.statusMode !== 'automatic') {
        return null;
    }

    const byDay = new Map(shop.openingHours.map((hours) => [hours.day, hours]));

    for (let ahead = 0; ahead < 8; ahead += 1) {
        const date = new Date(now);
        date.setDate(date.getDate() + ahead);

        const hours = byDay.get(date.getDay());

        if (!hours || hours.isClosed) {
            continue;
        }

        const [openHour, openMinute] = hours.opensAt.split(':').map(Number);
        date.setHours(openHour, openMinute ?? 0, 0, 0);

        if (date.getTime() > now.getTime()) {
            return date;
        }
    }

    return null;
}

/**
 * A sentence for when the shop next opens — "Opens today at 5:00 PM" — or null
 * when nothing is scheduled to open, which is also the answer in manual mode.
 */
export function nextOpeningLabel(
    shop: Shop,
    now: Date = new Date(),
): string | null {
    const target = nextOpening(shop, now);

    if (!target) {
        return null;
    }

    const startOfDay = (date: Date): number =>
        new Date(date).setHours(0, 0, 0, 0);
    const daysAhead = Math.round(
        (startOfDay(target) - startOfDay(now)) / 86_400_000,
    );

    const when =
        daysAhead === 0
            ? 'today'
            : daysAhead === 1
              ? 'tomorrow'
              : `on ${dayName(target.getDay())}`;
    const time = formatTime(
        `${target.getHours()}:${String(target.getMinutes()).padStart(2, '0')}`,
    );

    return `Opens ${when} at ${time}`;
}

/** One line of the weekly schedule, days with matching hours run together. */
export type HoursRow = {
    /** e.g. "Mon – Fri" or "Sat". */
    label: string;
    isClosed: boolean;
    opensAt: string;
    closesAt: string;
    /** Whether today falls inside this row's range. */
    isToday: boolean;
};

/**
 * The week as it should be read: Monday first, with consecutive days sharing
 * the same hours merged into one range, and the row covering today flagged so
 * it can be picked out.
 */
export function weeklyHours(shop: Shop, now: Date = new Date()): HoursRow[] {
    const byDay = new Map(shop.openingHours.map((hours) => [hours.day, hours]));
    const today = now.getDay();

    const groups: {
        startDay: number;
        endDay: number;
        hours: OpeningHours;
        isToday: boolean;
    }[] = [];

    for (const day of DISPLAY_ORDER) {
        const hours = byDay.get(day);

        if (!hours) {
            continue;
        }

        const last = groups.at(-1);
        const matchesLast =
            last !== undefined &&
            last.hours.isClosed === hours.isClosed &&
            (hours.isClosed ||
                (last.hours.opensAt === hours.opensAt &&
                    last.hours.closesAt === hours.closesAt));

        if (matchesLast) {
            last.endDay = day;
            last.isToday ||= day === today;
        } else {
            groups.push({
                startDay: day,
                endDay: day,
                hours,
                isToday: day === today,
            });
        }
    }

    return groups.map((group) => ({
        label:
            group.startDay === group.endDay
                ? SHORT_DAYS[group.startDay]
                : `${SHORT_DAYS[group.startDay]} – ${SHORT_DAYS[group.endDay]}`,
        isClosed: group.hours.isClosed,
        opensAt: group.hours.opensAt,
        closesAt: group.hours.closesAt,
        isToday: group.isToday,
    }));
}

/**
 * Whether the shop has hours worth printing. Manual mode has none — only a
 * switch — so anything that lays out around the schedule can ask first rather
 * than leaving a gap where it would have been.
 */
export function hasPublishedHours(shop: Shop): boolean {
    return shop.statusMode === 'automatic' && shop.openingHours.length > 0;
}

/** The shop's status and schedule, as shared with every page. */
export function useShop(): Shop {
    return usePage().props.shop;
}

/**
 * Whether the shop is open. On the automatic schedule this is re-checked every
 * half minute, so a shop that opens or closes while the menu is on screen says
 * so on its own.
 */
export function useShopOpen(): boolean {
    const shop = useShop();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (shop.statusMode !== 'automatic') {
            return;
        }

        const timer = window.setInterval(() => setNow(new Date()), TICK_MS);

        return () => window.clearInterval(timer);
    }, [shop.statusMode]);

    return isShopOpen(shop, now);
}
