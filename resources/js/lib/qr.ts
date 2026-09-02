import qrcode from 'qrcode-generator';

/** A QR code as a square of modules and one path that draws the dark ones. */
export type QrCode = {
    /** Modules per side, not pixels — the SVG scales itself to its box. */
    size: number;
    /** Path data in module units, drawn from `0 0` to `size size`. */
    path: string;
};

/**
 * Medium correction: a fifth of the code can be smudged, blocked by a thumb or
 * lost to a bad camera angle and it still reads. Higher levels survive more but
 * pack fewer characters into the same version, and this code is being read off
 * a bright screen a foot away rather than off a van in the rain.
 */
const CORRECTION = 'M';

/**
 * Build a QR code for a string, or null when it will not fit in one.
 *
 * The library is used only to work out which modules are dark; the drawing is
 * ours, as one path rather than a few hundred rects. Each run of dark modules
 * along a row becomes a single subpath, which for a typical code is a few
 * hundred bytes of `d` instead of a few thousand nodes for the browser to lay
 * out — and it means the code is vector, so it is exactly as sharp on a cheap
 * phone held up to a camera as on a desk monitor.
 */
export function buildQr(value: string): QrCode | null {
    try {
        const qr = qrcode(0, CORRECTION);
        qr.addData(value);
        qr.make();

        const size = qr.getModuleCount();
        let path = '';

        for (let row = 0; row < size; row += 1) {
            let run = 0;

            // One past the end, so a run that reaches the edge still closes.
            for (let column = 0; column <= size; column += 1) {
                if (column < size && qr.isDark(row, column)) {
                    run += 1;

                    continue;
                }

                if (run > 0) {
                    path += `M${column - run} ${row}h${run}v1h-${run}z`;
                    run = 0;
                }
            }
        }

        return { size, path };
    } catch {
        // Thrown when the string is longer than the largest version holds.
        // There is nothing to draw and nothing to be done about it here.
        return null;
    }
}
