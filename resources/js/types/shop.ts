/** Mirrors `App\Enums\ShopStatusMode` — how the open/closed state is decided. */
export type ShopStatusMode = 'manual' | 'automatic';

/** One weekday's hours. `day` is JS-style, so `Date.getDay()` indexes it. */
export type OpeningHours = {
    day: number;
    isClosed: boolean;
    /** `HH:mm`. */
    opensAt: string;
    /** `HH:mm`. At or before `opensAt` means the session runs past midnight. */
    closesAt: string;
};

/** Whether the shop is open, and everything needed to answer that again later. */
export type Shop = {
    /** The server's answer at render time; the client recomputes from here. */
    isOpen: boolean;
    statusMode: ShopStatusMode;
    /** The manual switch. Only authoritative in `manual` mode. */
    isManuallyOpen: boolean;
    /** The weekly schedule. Only authoritative in `automatic` mode. */
    openingHours: OpeningHours[];
};
