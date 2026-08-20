import { useId } from 'react';

import { cn } from '@/lib/utils';

/**
 * Light stone wall used as the page wallpaper.
 *
 * The wall is one tile repeated with an SVG `<pattern>`, so it costs a single
 * small drawing no matter how large the viewport gets. The tile is measured in
 * CSS pixels rather than a viewBox, which keeps the stones the same physical
 * size on a phone and on a desk monitor.
 */

const TILE_WIDTH = 240;
const TILE_HEIGHT = 128;

/** Height of a course, and the distance from one course to the next. */
const COURSE_HEIGHT = 26;
const COURSE_PITCH = 32;

/** Mortar gap, split evenly on either side of every joint. */
const JOINT = 6;

/**
 * The vertical joints of each course, in tile units. Every course spans exactly
 * one tile width, so a stone hanging off one edge is redrawn on the other and
 * the repeat leaves no seam. The joints are staggered course to course — and
 * across the top/bottom wrap — so no two lines ever run into each other.
 */
const COURSE_JOINTS: readonly (readonly number[])[] = [
    [-14, 44, 110, 158, 226],
    [-44, 20, 88, 140, 196],
    [-26, 56, 118, 164, 214],
    [8, 80, 136, 186, 248],
];

/** Cool greys, close enough together to read as one wall. */
const STONE_FILLS = [
    '#e3e1de',
    '#dad8d5',
    '#e8e6e3',
    '#d0cdc9',
    '#dfddda',
    '#e1dfdc',
] as const;

const MORTAR = '#c4c1bb';

type Stone = {
    x: number;
    y: number;
    width: number;
    fill: string;
};

const STONES: readonly Stone[] = COURSE_JOINTS.flatMap((joints, course) =>
    joints.slice(0, -1).map((start, index) => ({
        x: start + JOINT / 2,
        y: course * COURSE_PITCH,
        width: joints[index + 1] - start - JOINT,
        fill: STONE_FILLS[(course * 3 + index * 5) % STONE_FILLS.length],
    })),
);

/** Copies that complete the stones straddling the left and right tile edges. */
const WRAP_OFFSETS = [-TILE_WIDTH, 0, TILE_WIDTH] as const;

export function StoneWallBackdrop({ className }: { className?: string }) {
    // Two backdrops on one page would otherwise share — and fight over — ids.
    const suffix = useId();
    const wallId = `stone-wall-${suffix}`;
    const grainId = `stone-grain-${suffix}`;
    const washId = `stone-wash-${suffix}`;

    return (
        <svg
            aria-hidden
            className={cn(
                'pointer-events-none fixed inset-0 -z-10 h-full w-full',
                className,
            )}
        >
            <defs>
                {/* Grain lives inside the tile, so the filter runs once for the
                    whole wall instead of over the full viewport. */}
                <filter id={grainId} x="0" y="0" width="100%" height="100%">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.9"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>

                <pattern
                    id={wallId}
                    width={TILE_WIDTH}
                    height={TILE_HEIGHT}
                    patternUnits="userSpaceOnUse"
                    patternTransform="scale(1.35)"
                >
                    <rect
                        width={TILE_WIDTH}
                        height={TILE_HEIGHT}
                        fill={MORTAR}
                    />

                    {WRAP_OFFSETS.map((offset) =>
                        STONES.map((stone) => (
                            <rect
                                key={`${offset}-${stone.x}-${stone.y}`}
                                x={stone.x + offset}
                                y={stone.y}
                                width={stone.width}
                                height={COURSE_HEIGHT}
                                rx="3"
                                fill={stone.fill}
                                stroke="#000"
                                strokeOpacity="0.05"
                                strokeWidth="1"
                            />
                        )),
                    )}

                    <rect
                        width={TILE_WIDTH}
                        height={TILE_HEIGHT}
                        filter={`url(#${grainId})`}
                        opacity="0.06"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </pattern>

                {/* Light pooled in the middle: the wall stays a wall at the
                    edges and gets out of the way behind the content. */}
                <radialGradient id={washId} cx="50%" cy="45%" r="75%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.62" />
                    <stop offset="55%" stopColor="#fff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
            </defs>

            <rect width="100%" height="100%" fill={`url(#${wallId})`} />
            <rect width="100%" height="100%" fill={`url(#${washId})`} />
        </svg>
    );
}
