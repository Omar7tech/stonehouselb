import { useMemo } from 'react';

import { buildQr } from '@/lib/qr';
import { cn } from '@/lib/utils';

/**
 * The blank border a scanner needs around the code to find its edges. Four
 * modules is what the specification asks for; less and readers start hunting.
 */
const QUIET_ZONE = 4;

/**
 * A QR code, drawn to be read off a screen by somebody else's camera.
 *
 * Deliberately black on white in both themes. A code is not a picture, it is a
 * signal, and every reader is built to expect a dark pattern on a light ground
 * — inverted codes are the single most common reason a beautiful QR does not
 * scan. So the plate stays white even at midnight in dark mode, which also
 * happens to be the brightest thing the screen can offer the camera.
 *
 * A default export, and the only thing in this file, so that it and the encoder
 * behind it can be split into a chunk of their own. Almost nobody who opens the
 * menu will ever show a code, and none of them should be made to download the
 * machinery for one on the way in.
 */
export default function OrderQr({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    const qr = useMemo(() => buildQr(value), [value]);

    if (qr === null) {
        return (
            <p className="rounded-2xl bg-surface p-6 text-center text-xs text-muted-foreground">
                This basket is too big to fit in a code. Send the link instead.
            </p>
        );
    }

    const span = qr.size + QUIET_ZONE * 2;

    return (
        <svg
            viewBox={`0 0 ${span} ${span}`}
            // Off, or the browser softens every module edge and hands the
            // camera a grey blur to threshold.
            shapeRendering="crispEdges"
            role="img"
            aria-label="A code that opens this basket on another phone"
            className={cn('aspect-square h-auto w-full', className)}
        >
            <rect width={span} height={span} rx={2} fill="#ffffff" />

            {/* The code itself sits inside the quiet zone rather than the path
                carrying the offset, so the maths above stays in plain module
                coordinates. */}
            <g transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`}>
                <path d={qr.path} fill="#111111" />
            </g>
        </svg>
    );
}
