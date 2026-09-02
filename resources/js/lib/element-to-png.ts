/**
 * Turn a piece of the page into a high-resolution PNG, in the browser, with
 * nothing installed to do it.
 *
 * The trick is SVG's `foreignObject`: it will hold real HTML, and an SVG can be
 * loaded into an `Image` and drawn onto a canvas. So the sheet is cloned, every
 * style it is currently wearing is written onto the clone, the whole thing is
 * wrapped in an SVG and rasterised at whatever scale is asked for.
 *
 * Two rules make it work, and breaking either gives a blank picture:
 *
 * 1. Nothing may reference anything outside the SVG. A stylesheet, a font file
 *    or an `<img src>` will simply not load — the browser treats the SVG as an
 *    image, and images do not fetch. So styles are inlined and pictures are
 *    turned into data URIs first.
 * 2. The markup has to be valid XML, since the SVG is parsed as XML rather than
 *    as HTML. Serializing from the DOM gives us that for free.
 */

/**
 * The properties actually copied onto the clone.
 *
 * A whitelist rather than everything: a computed style has some 350 properties
 * and writing them all onto a few hundred nodes makes a document megabytes wide
 * that the browser then has to parse as XML. These are the ones that decide how
 * this looks.
 */
const COPIED = [
    'box-sizing',
    'display',
    'position',
    'width',
    'height',
    'min-height',
    'max-width',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'color',
    'background-color',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-variant-numeric',
    'line-height',
    'letter-spacing',
    'text-align',
    'text-transform',
    'text-decoration-line',
    'white-space',
    'overflow-wrap',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'flex-direction',
    'align-items',
    'justify-content',
    'gap',
    'column-count',
    'column-gap',
    'list-style',
    'transform',
    'opacity',
    'vertical-align',
] as const;

/**
 * Render an element to a PNG blob.
 *
 * `scale` is how many device pixels each CSS pixel becomes — 3 puts an A4 sheet
 * at roughly 300 dots per inch, which is what a printer wants and what stops
 * the type going soft when somebody zooms in on their phone.
 *
 * `styles` is any CSS the clone still needs that cannot be written onto a node:
 * pseudo-elements, chiefly. The rules that draw the leader dots and the lines
 * either side of a category heading live in `::before` and `::after`, and no
 * amount of inlining will carry those across.
 */
export async function elementToPng(
    element: HTMLElement,
    { scale = 3, styles = '' }: { scale?: number; styles?: string } = {},
): Promise<Blob> {
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const clone = element.cloneNode(true) as HTMLElement;

    copyStyles(element, clone);
    await inlineImages(clone);

    // The clone is positioned by the foreignObject, so whatever the original
    // was doing to place itself on the page has to go.
    clone.style.margin = '0';
    clone.style.position = 'static';
    clone.style.boxShadow = 'none';

    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        `<foreignObject width="100%" height="100%">`,
        `<div xmlns="http://www.w3.org/1999/xhtml">`,
        styles === '' ? '' : `<style>${escapeForXml(styles)}</style>`,
        new XMLSerializer().serializeToString(clone),
        `</div></foreignObject></svg>`,
    ].join('');

    const image = await loadImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);

    const context = canvas.getContext('2d');

    if (context === null) {
        throw new Error('This browser cannot draw the sheet.');
    }

    // White underneath, or every transparent pixel comes out black in a PNG
    // that anybody then prints.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob === null) {
                reject(
                    new Error('The sheet could not be turned into an image.'),
                );

                return;
            }

            resolve(blob);
        }, 'image/png');
    });
}

/** Hand a blob to the browser as a download. */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    // Freed on the next turn, so the click has been dealt with by then.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Walk the original and the clone together, writing what the browser worked out
 * onto what the SVG will render. They are the same shape, so one index walk
 * keeps them in step.
 */
function copyStyles(source: HTMLElement, clone: HTMLElement): void {
    const computed = window.getComputedStyle(source);
    let inline = '';

    COPIED.forEach((property) => {
        const value = computed.getPropertyValue(property);

        if (value !== '') {
            inline += `${property}:${value};`;
        }
    });

    clone.setAttribute('style', inline);

    const sources = source.children;
    const clones = clone.children;

    for (let index = 0; index < sources.length; index += 1) {
        const child = sources[index];
        const childClone = clones[index];

        if (child instanceof HTMLElement && childClone instanceof HTMLElement) {
            copyStyles(child, childClone);
        }
    }
}

/**
 * Turn every picture in the clone into a data URI, since an `<img>` pointing at
 * a path will render as nothing once the whole thing is an image itself.
 *
 * A picture that will not load is dropped rather than left to fail: a missing
 * logo is better than a broken-image glyph printed at 300dpi.
 */
async function inlineImages(clone: HTMLElement): Promise<void> {
    const images = [...clone.querySelectorAll('img')];

    await Promise.all(
        images.map(async (image) => {
            const source = image.getAttribute('src');

            if (source === null || source.startsWith('data:')) {
                return;
            }

            try {
                const response = await fetch(source);
                const blob = await response.blob();

                image.setAttribute('src', await blobToDataUrl(blob));
            } catch {
                image.remove();
            }
        }),
    );
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the image.'));
        reader.readAsDataURL(blob);
    });
}

function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error('The sheet could not be drawn as an image.'));
        image.src = source;
    });
}

/** The style block is going into XML, where `&` and `<` are not text. */
function escapeForXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
