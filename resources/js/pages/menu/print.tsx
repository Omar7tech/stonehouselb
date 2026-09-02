import { Head } from '@inertiajs/react';
import { Download, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';

import type { OrderType } from '@/types';

/** A dish as the sheet needs it. Mirrors `App\Http\Controllers\PrintMenuController`. */
type PrintProduct = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    discountPrice: number | null;
    /** Which menu it belongs to, so the switches can sort it without a reload. */
    orderType: OrderType | 'both';
    isSpicy: boolean;
    isVegan: boolean;
    isFeatured: boolean;
    variants: { name: string; price: number; discountPrice: number | null }[];
    ingredients: string[];
};

type PrintCategory = { id: number; name: string; products: PrintProduct[] };

interface PrintMenuProps {
    shopName: string;
    phone: string | null;
    categories: PrintCategory[];
}

/**
 * The shapes a menu gets asked for.
 *
 * Paper and screen both, because the same list of dishes is wanted as an A4
 * sheet for the tables and as a square for Instagram, and nobody should have to
 * lay it out twice. `scale` is chosen per format so the file lands at a sane
 * size: A4 wants the resolution a printer can use, a square only ever needs the
 * 1080px the platforms accept.
 */
const FORMATS = {
    a4: {
        label: 'A4',
        width: '210mm',
        height: '297mm',
        pad: '14mm',
        base: 13,
        scale: 3,
    },
    a5: {
        label: 'A5',
        width: '148mm',
        height: '210mm',
        pad: '10mm',
        base: 11,
        scale: 3,
    },
    square: {
        label: 'Square',
        width: '540px',
        height: '540px',
        pad: '38px',
        base: 12,
        scale: 2,
    },
    story: {
        label: 'Story',
        width: '540px',
        height: '960px',
        pad: '44px',
        base: 13,
        scale: 2,
    },
} as const;

type Format = keyof typeof FORMATS;

/**
 * Ink and paper.
 *
 * Dark is not a novelty here — it is what a menu posted to a story wants, and a
 * cream sheet is what a printed one wants. The values are plain hex rather than
 * the site's tokens because this sheet is exported as a picture, where nothing
 * resolves a theme for you.
 */
const THEMES = {
    cream: {
        label: 'Cream',
        paper: '#faf7f2',
        ink: '#16130f',
        muted: '#6b6259',
        rule: '#c9c2b8',
    },
    white: {
        label: 'White',
        paper: '#ffffff',
        ink: '#16130f',
        muted: '#6b6259',
        rule: '#d5cec4',
    },
    charcoal: {
        label: 'Dark',
        paper: '#16130f',
        ink: '#f4efe7',
        muted: '#a99e91',
        rule: '#4a423a',
    },
} as const;

type Theme = keyof typeof THEMES;

/**
 * System faces only. A web font is fetched from a URL, and the export renders
 * the sheet as an image, where nothing is fetched — so a menu set in the site's
 * display face would come out in whatever the browser fell back to. The logo
 * carries the brand instead, which is what a logo is for.
 */
const TYPEFACES = {
    serif: { label: 'Serif', stack: "Georgia, 'Times New Roman', serif" },
    sans: { label: 'Sans', stack: "'Helvetica Neue', Arial, sans-serif" },
} as const;

type Typeface = keyof typeof TYPEFACES;

type Options = {
    orderType: OrderType;
    format: Format;
    theme: Theme;
    typeface: Typeface;
    columns: 1 | 2 | 3;
    /** Blank falls back to the menu's own name. */
    title: string;
    descriptions: boolean;
    ingredients: boolean;
    marks: boolean;
    sizes: boolean;
    logo: boolean;
    phone: boolean;
    /** Category ids left off the sheet, for a one-category flyer. */
    hidden: number[];
};

const DEFAULTS: Options = {
    orderType: 'dine_in',
    format: 'a4',
    theme: 'cream',
    typeface: 'serif',
    columns: 2,
    title: '',
    descriptions: true,
    ingredients: false,
    marks: true,
    sizes: true,
    logo: true,
    phone: true,
    hidden: [],
};

/** Dollars, always. A sheet outlives an exchange rate. */
function usd(value: number): string {
    return `$${value.toFixed(2)}`;
}

/** A filename somebody can find again: `stone-house-dine-in-menu.png`. */
function slug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * The menu, laid out and saved as a picture.
 *
 * A workbench rather than a view: the switches on the left change the sheet on
 * the right as they are pressed, because whoever is setting a menu is trying
 * things until it fits, and a reload between each try makes that unbearable.
 *
 * A picture rather than a PDF, and the difference matters at the till: a PNG
 * downloads on the press with no dialog, opens on any phone, prints from any
 * machine, and goes into a WhatsApp status or an Instagram post without being
 * converted by somebody first.
 */
export default function PrintMenu({
    shopName,
    phone,
    categories,
}: PrintMenuProps) {
    const [options, setOptions] = useState<Options>(DEFAULTS);
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);

    // The sheet itself, which is what gets photographed.
    const sheetRef = useRef<HTMLElement>(null);

    const set = <K extends keyof Options>(key: K, value: Options[K]): void =>
        setOptions((previous) => ({ ...previous, [key]: value }));

    const format = FORMATS[options.format];
    const theme = THEMES[options.theme];

    // Only what this menu sells, only the categories left switched on, and only
    // the ones with something left in them — the same rule the storefront
    // applies, so the sheet and the site never list a different set.
    const sheet = categories
        .filter((category) => !options.hidden.includes(category.id))
        .map((category) => ({
            ...category,
            products: category.products.filter(
                (product) =>
                    product.orderType === options.orderType ||
                    product.orderType === 'both',
            ),
        }))
        .filter((category) => category.products.length > 0);

    const dishes = sheet.reduce(
        (total, category) => total + category.products.length,
        0,
    );

    const menuName = options.orderType === 'delivery' ? 'Delivery' : 'Dine-in';
    const title = options.title.trim() === '' ? menuName : options.title.trim();

    /**
     * Save the sheet as a picture. The machinery is fetched only when it is
     * asked for — almost nobody who opens this page presses this, and none of
     * them should download an image encoder on the way in.
     */
    const download = async (): Promise<void> => {
        const node = sheetRef.current;

        if (node === null || saving) {
            return;
        }

        setSaving(true);
        setFailed(false);

        try {
            const { downloadBlob, elementToPng } =
                await import('@/lib/element-to-png');

            const png = await elementToPng(node, {
                scale: format.scale,
                styles: SHEET_CSS,
                background: theme.paper,
            });

            downloadBlob(png, `${slug(shopName)}-${slug(title)}-menu.png`);
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Head title={`${shopName} — ${title} menu`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <style>{SHEET_CSS}</style>

            <div className="min-h-screen bg-[#e9e5df] text-[#16130f] lg:flex lg:items-start lg:gap-8 lg:p-8">
                <Controls
                    options={options}
                    set={set}
                    categories={categories}
                    dishes={dishes}
                    menuName={menuName}
                    saving={saving}
                    failed={failed}
                    onDownload={() => void download()}
                />

                {/* The sheet, at exactly the size it will be exported. What is
                    on screen is the picture, so there is nothing to be
                    surprised by after the download. */}
                <div className="mx-auto my-6 overflow-x-auto lg:my-0">
                    <main
                        ref={sheetRef}
                        className="sheet shadow-[0_2px_24px_rgb(0_0_0/0.14)]"
                        style={{
                            width: format.width,
                            minHeight: format.height,
                            padding: format.pad,
                            fontSize: `${format.base}px`,
                            fontFamily: TYPEFACES[options.typeface].stack,
                            background: theme.paper,
                            color: theme.ink,
                            // Read by the rules in SHEET_CSS that inline styles
                            // cannot reach: the leader dots and the lines
                            // either side of a category name.
                            ['--rule' as string]: theme.rule,
                            ['--muted' as string]: theme.muted,
                        }}
                    >
                        <header className="mb-[1.6em] text-center">
                            {options.logo && (
                                <img
                                    src="/logos/logo.svg"
                                    alt={shopName}
                                    className="mx-auto mb-[0.9em] block h-auto w-[54%]"
                                    style={{
                                        // The mark is drawn dark; on a dark
                                        // sheet it has to be flipped or it
                                        // disappears into the paper.
                                        filter:
                                            options.theme === 'charcoal'
                                                ? 'invert(1) brightness(1.6)'
                                                : undefined,
                                    }}
                                />
                            )}

                            {/* A heavy rule over a hairline — the double rule a
                                printed menu has had for a century, and the
                                cheapest way to make a sheet look set rather
                                than exported. */}
                            <div
                                className="mb-[0.7em] h-[0.25em]"
                                style={{
                                    borderTop: `2px solid ${theme.ink}`,
                                    borderBottom: `1px solid ${theme.ink}`,
                                }}
                            />

                            <p
                                className="m-0 text-[0.62em] tracking-[0.3em] uppercase"
                                style={{ color: theme.muted }}
                            >
                                {title}
                                {options.phone &&
                                    phone !== null &&
                                    ` · ${phone}`}
                            </p>
                        </header>

                        {sheet.length === 0 ? (
                            <p
                                className="py-[6em] text-center text-[0.85em] italic"
                                style={{ color: theme.muted }}
                            >
                                Nothing to put on this sheet yet.
                            </p>
                        ) : (
                            <div
                                className="columns"
                                style={{ columnCount: options.columns }}
                            >
                                {sheet.map((category) => (
                                    <section
                                        key={category.id}
                                        className="category mb-[1.5em]"
                                    >
                                        <h2 className="category-name m-0 mb-[0.7em] flex items-center gap-[0.7em] text-[0.8em] font-normal tracking-[0.24em] whitespace-nowrap uppercase">
                                            {category.name}
                                        </h2>

                                        {category.products.map((product) => (
                                            <Dish
                                                key={product.id}
                                                product={product}
                                                options={options}
                                                theme={theme}
                                            />
                                        ))}
                                    </section>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

/** One dish: the leader line, and whatever the switches have left on. */
function Dish({
    product,
    options,
    theme,
}: {
    product: PrintProduct;
    options: Options;
    theme: (typeof THEMES)[Theme];
}) {
    const sizes = options.sizes ? product.variants : [];
    const marks = options.marks
        ? [
              product.isSpicy && 'spicy',
              product.isVegan && 'vegan',
              product.isFeatured && 'favourite',
          ].filter((mark): mark is string => mark !== false)
        : [];

    return (
        <article className="dish mb-[0.75em]">
            <div className="line flex items-baseline gap-[0.3em]">
                <span className="font-bold">
                    {product.name}
                    {marks.length > 0 && (
                        <span
                            className="ml-[0.4em] text-[0.62em] font-normal tracking-[0.12em] uppercase"
                            style={{ color: theme.muted }}
                        >
                            {marks.join(' · ')}
                        </span>
                    )}
                </span>

                {/* A dish sold in sizes has no single price to quote here; its
                    sizes carry them. */}
                {sizes.length === 0 && (
                    <>
                        <span className="leader" />
                        <span className="whitespace-nowrap tabular-nums">
                            {product.discountPrice !== null && (
                                <span
                                    className="mr-[0.3em] line-through"
                                    style={{ color: theme.muted }}
                                >
                                    {usd(product.price)}
                                </span>
                            )}
                            {usd(product.discountPrice ?? product.price)}
                        </span>
                    </>
                )}
            </div>

            {options.descriptions && product.description !== null && (
                <p
                    className="mt-[0.15em] mb-0 text-[0.72em] leading-[1.3] italic"
                    style={{ color: theme.muted }}
                >
                    {product.description}
                </p>
            )}

            {options.ingredients && product.ingredients.length > 0 && (
                <p
                    className="mt-[0.15em] mb-0 text-[0.66em] tracking-[0.04em]"
                    style={{ color: theme.muted }}
                >
                    {product.ingredients.join(' · ')}
                </p>
            )}

            {sizes.length > 0 && (
                <ul className="mt-[0.25em] mb-0 list-none p-0 pl-[1.2em] text-[0.85em]">
                    {sizes.map((size) => (
                        <li
                            key={size.name}
                            className="line flex items-baseline gap-[0.3em]"
                        >
                            <span>{size.name}</span>
                            <span className="leader" />
                            <span className="whitespace-nowrap tabular-nums">
                                {size.discountPrice !== null && (
                                    <span
                                        className="mr-[0.3em] line-through"
                                        style={{ color: theme.muted }}
                                    >
                                        {usd(size.price)}
                                    </span>
                                )}
                                {usd(size.discountPrice ?? size.price)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

/** The switches. None of this is in the picture. */
function Controls({
    options,
    set,
    categories,
    dishes,
    menuName,
    saving,
    failed,
    onDownload,
}: {
    options: Options;
    set: <K extends keyof Options>(key: K, value: Options[K]) => void;
    categories: PrintCategory[];
    dishes: number;
    menuName: string;
    saving: boolean;
    failed: boolean;
    onDownload: () => void;
}) {
    const format = FORMATS[options.format];

    const toggleCategory = (id: number): void =>
        set(
            'hidden',
            options.hidden.includes(id)
                ? options.hidden.filter((hidden) => hidden !== id)
                : [...options.hidden, id],
        );

    return (
        <aside className="w-full shrink-0 border-b border-[#d0cac1] bg-white p-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:w-80 lg:overflow-y-auto lg:rounded-2xl lg:border lg:shadow-sm">
            <h1 className="text-base font-semibold uppercase">The menu, set</h1>
            <p className="mt-1 text-xs text-[#6b6259]">
                Everything here changes the sheet as you press it. Save it as a
                picture: it prints, it opens on any phone, and it goes straight
                into a post.
            </p>

            <div className="mt-5 flex flex-col gap-5">
                <Choice
                    label="Menu"
                    value={options.orderType}
                    options={[
                        { value: 'dine_in', label: 'Dine-in' },
                        { value: 'delivery', label: 'Delivery' },
                    ]}
                    onChange={(value) => set('orderType', value as OrderType)}
                />

                <Choice
                    label="Size"
                    value={options.format}
                    options={Object.entries(FORMATS).map(([value, entry]) => ({
                        value,
                        label: entry.label,
                    }))}
                    onChange={(value) => set('format', value as Format)}
                />

                <Choice
                    label="Paper"
                    value={options.theme}
                    options={Object.entries(THEMES).map(([value, entry]) => ({
                        value,
                        label: entry.label,
                    }))}
                    onChange={(value) => set('theme', value as Theme)}
                />

                <Choice
                    label="Type"
                    value={options.typeface}
                    options={Object.entries(TYPEFACES).map(
                        ([value, entry]) => ({ value, label: entry.label }),
                    )}
                    onChange={(value) => set('typeface', value as Typeface)}
                />

                <Choice
                    label="Columns"
                    value={String(options.columns)}
                    options={[
                        { value: '1', label: '1' },
                        { value: '2', label: '2' },
                        { value: '3', label: '3' },
                    ]}
                    onChange={(value) =>
                        set('columns', Number(value) as Options['columns'])
                    }
                />

                <label className="flex flex-col gap-2">
                    <span className="text-[0.65rem] tracking-[0.18em] text-[#6b6259] uppercase">
                        Heading
                    </span>
                    <input
                        type="text"
                        value={options.title}
                        onChange={(event) => set('title', event.target.value)}
                        placeholder={menuName}
                        maxLength={60}
                        className="rounded-lg border border-[#d0cac1] px-3 py-2 text-sm placeholder:text-[#a89e92] focus-visible:ring-3 focus-visible:ring-[#16130f]/20 focus-visible:outline-none"
                    />
                </label>

                <div className="flex flex-col gap-2">
                    <span className="text-[0.65rem] tracking-[0.18em] text-[#6b6259] uppercase">
                        Include
                    </span>

                    <Toggle
                        label="Logo"
                        checked={options.logo}
                        onChange={(value) => set('logo', value)}
                    />
                    <Toggle
                        label="Phone number"
                        checked={options.phone}
                        onChange={(value) => set('phone', value)}
                    />
                    <Toggle
                        label="Descriptions"
                        checked={options.descriptions}
                        onChange={(value) => set('descriptions', value)}
                    />
                    <Toggle
                        label="Sizes and their prices"
                        checked={options.sizes}
                        onChange={(value) => set('sizes', value)}
                    />
                    <Toggle
                        label="Spicy, vegan, favourite"
                        checked={options.marks}
                        onChange={(value) => set('marks', value)}
                    />
                    <Toggle
                        label="Ingredients"
                        checked={options.ingredients}
                        onChange={(value) => set('ingredients', value)}
                    />
                </div>

                {/* Switching categories off is what turns a menu into a flyer
                    for one thing — a grills sheet, a desserts card. */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[0.65rem] tracking-[0.18em] text-[#6b6259] uppercase">
                            Categories
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                set(
                                    'hidden',
                                    options.hidden.length > 0
                                        ? []
                                        : categories.map(
                                              (category) => category.id,
                                          ),
                                )
                            }
                            className="text-[0.65rem] tracking-wide text-[#16130f] uppercase underline underline-offset-2"
                        >
                            {options.hidden.length > 0 ? 'All' : 'None'}
                        </button>
                    </div>

                    {categories.map((category) => (
                        <Toggle
                            key={category.id}
                            label={category.name}
                            checked={!options.hidden.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                        />
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={onDownload}
                disabled={saving || dishes === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#16130f] px-4 py-3.5 text-sm font-semibold text-white uppercase transition-transform duration-200 ease-out hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-[#16130f]/30 focus-visible:outline-none active:scale-[0.99] disabled:scale-100 disabled:opacity-50"
            >
                {saving ? (
                    <LoaderCircle aria-hidden className="size-4 animate-spin" />
                ) : (
                    <Download aria-hidden className="size-4" />
                )}
                {saving ? 'Drawing…' : 'Download image'}
            </button>

            <p className="mt-3 text-center text-[0.7rem] text-[#6b6259]">
                {failed
                    ? 'That did not work. Try a smaller sheet, or fewer columns.'
                    : `${dishes === 1 ? '1 dish' : `${dishes} dishes`} · ${format.label} · PNG`}
            </p>
        </aside>
    );
}

/** A row of mutually exclusive buttons, which beats a select for two to four. */
function Choice({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[0.65rem] tracking-[0.18em] text-[#6b6259] uppercase">
                {label}
            </span>

            <div className="flex gap-1.5">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={option.value === value}
                        onClick={() => onChange(option.value)}
                        className={
                            option.value === value
                                ? 'flex-1 rounded-full bg-[#16130f] px-2 py-2 text-xs font-semibold text-white'
                                : 'flex-1 rounded-full bg-[#f0ede8] px-2 py-2 text-xs font-medium text-[#3d372f] hover:bg-[#e5e0d9]'
                        }
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4 shrink-0 accent-[#16130f]"
            />
            <span className="min-w-0 truncate">{label}</span>
        </label>
    );
}

/**
 * What an inline style cannot say.
 *
 * These are pseudo-elements, and no amount of copying computed styles onto a
 * node will carry them across — so this same string is handed to the exporter,
 * which injects it beside the clone inside the SVG. They read `--rule` off the
 * sheet, which is where the theme sets it.
 */
const SHEET_CSS = `
    .sheet { line-height: 1.35; }

    .columns { column-gap: 2.2em; }

    /* Never strand a heading at the foot of a column with its first dish
       overleaf, and never break a dish across two. */
    .category { break-inside: avoid-column; }
    .dish { break-inside: avoid; }

    /* Rules running out to both edges of the column, so a heading reads as a
       division of the menu rather than as the first line of the block. */
    .category-name::before,
    .category-name::after {
        content: '';
        flex: 1;
        border-top: 1px solid var(--rule, #c9c2b8);
    }

    /* The classic leader: the name and the price are the ends of the row and
       the dots are whatever is left between them, so they always meet however
       long the name runs. */
    .leader {
        flex: 1;
        border-bottom: 1px dotted var(--rule, #b3aa9e);
        transform: translateY(-0.25em);
    }
`;
