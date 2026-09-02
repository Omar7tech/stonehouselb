import { Head } from '@inertiajs/react';
import { Download, LoaderCircle, Printer } from 'lucide-react';
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

/** What the sheet holds and how it is set. All of it lives in the page. */
type Options = {
    orderType: OrderType;
    columns: 1 | 2 | 3;
    descriptions: boolean;
    ingredients: boolean;
    marks: boolean;
    sizes: boolean;
};

const DEFAULTS: Options = {
    orderType: 'dine_in',
    columns: 2,
    descriptions: true,
    ingredients: false,
    marks: true,
    sizes: true,
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
 * The menu, set for paper.
 *
 * A workbench rather than a view: the switches on the left change the sheet on
 * the right as they are pressed, because the person setting a menu is trying
 * things until it fits on the page, and a reload between each try makes that
 * unbearable.
 *
 * "Save as PDF" is the browser's own print destination, and it is the good one:
 * it prints vector text at the printer's resolution, keeps the type crisp at any
 * zoom, and needs nothing installed on the server. So the button opens that
 * dialog rather than pretending to be it — and the page title is set to what the
 * file should be called, which is what the dialog offers as the filename.
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

    // Only what this menu sells, and only the categories left with something in
    // them — the same rule the storefront applies, so the sheet and the site
    // never list a different set of categories.
    const sheet = categories
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

    const label = options.orderType === 'delivery' ? 'Delivery' : 'Dine-in';

    /**
     * Save the sheet as a picture.
     *
     * The heavy lifting is fetched only when it is asked for — almost nobody
     * who opens this page presses this, and none of them should download the
     * machinery for it on the way in.
     */
    const download = async (): Promise<void> => {
        const sheet = sheetRef.current;

        if (sheet === null || saving) {
            return;
        }

        setSaving(true);
        setFailed(false);

        try {
            const { downloadBlob, elementToPng } =
                await import('@/lib/element-to-png');

            const png = await elementToPng(sheet, {
                // Roughly 300dpi for an A4 sheet: what a printer wants, and
                // enough that the type stays sharp when it is zoomed into on a
                // phone.
                scale: 3,
                styles: PRINT_CSS,
            });

            downloadBlob(png, `${slug(shopName)}-${slug(label)}-menu.png`);
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Chrome and Safari offer the document title as the PDF's
                filename, so this is not decoration — it is what the file is
                called when it lands in Downloads. */}
            <Head title={`${shopName} — ${label} menu`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <style>{PRINT_CSS}</style>

            <div className="shell min-h-screen bg-[#edeae5] text-[#16130f] lg:flex lg:items-start lg:gap-8 lg:p-8">
                <Controls
                    options={options}
                    set={set}
                    dishes={dishes}
                    label={label}
                    saving={saving}
                    failed={failed}
                    onDownload={() => void download()}
                />

                {/* The sheet. Fixed at A4's width so what is on screen is what
                    comes out of the printer, rather than a fluid column that
                    reflows the moment it meets paper. */}
                <main
                    ref={sheetRef}
                    className="sheet mx-auto my-6 min-h-[297mm] w-[210mm] bg-white p-[14mm] shadow-[0_2px_18px_rgb(0_0_0/0.12)] lg:my-0"
                >
                    <header className="mb-[8mm] text-center">
                        {/* The house mark rather than the name set in a serif:
                            the same wordmark the site opens with, so the sheet
                            on the table and the page on the phone are
                            recognisably one shop. */}
                        <img
                            src="/logos/logo.svg"
                            alt={shopName}
                            className="mx-auto mb-[4mm] block h-auto w-[62mm]"
                        />

                        {/* A heavy rule over a hairline — the double rule a
                            printed menu has had for a century, and the cheapest
                            way to make one sheet of A4 look set rather than
                            exported. */}
                        <div className="mb-[3mm] h-[1.2mm] border-t-2 border-b border-[#16130f]" />

                        <p className="m-0 text-[7.5pt] tracking-[0.3em] text-[#6b6259] uppercase">
                            {label}
                            {phone !== null && ` · ${phone}`}
                        </p>
                    </header>

                    {sheet.length === 0 ? (
                        <p className="py-[24mm] text-center text-[#6b6259] italic">
                            Nothing is published on this menu yet.
                        </p>
                    ) : (
                        <div
                            className="columns"
                            style={{ columnCount: options.columns }}
                        >
                            {sheet.map((category) => (
                                <section
                                    key={category.id}
                                    className="category mb-[6mm]"
                                >
                                    <h2 className="category-name m-0 mb-[3mm] flex items-center gap-[3mm] text-[10pt] font-normal tracking-[0.24em] whitespace-nowrap uppercase">
                                        {category.name}
                                    </h2>

                                    {category.products.map((product) => (
                                        <Dish
                                            key={product.id}
                                            product={product}
                                            options={options}
                                        />
                                    ))}
                                </section>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

/** One dish: the leader line, and whatever the switches have left on. */
function Dish({
    product,
    options,
}: {
    product: PrintProduct;
    options: Options;
}) {
    const sizes = options.sizes ? product.variants : [];
    const marks = options.marks
        ? [
              product.isSpicy && 'spicy',
              product.isVegan && 'vegan',
              product.isFeatured && 'house favourite',
          ].filter((mark): mark is string => mark !== false)
        : [];

    return (
        <article className="dish mb-[3mm]">
            <div className="line flex items-baseline gap-[1.5mm]">
                <span className="font-bold">
                    {product.name}
                    {marks.length > 0 && (
                        <span className="ml-[1.5mm] text-[7pt] font-normal tracking-[0.12em] text-[#8a8177] uppercase">
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
                                <span className="mr-[1.5mm] text-[#8a8177] line-through">
                                    {usd(product.price)}
                                </span>
                            )}
                            {usd(product.discountPrice ?? product.price)}
                        </span>
                    </>
                )}
            </div>

            {options.descriptions && product.description !== null && (
                <p className="mt-[0.6mm] mb-0 text-[8pt] leading-[1.25] text-[#6b6259] italic">
                    {product.description}
                </p>
            )}

            {options.ingredients && product.ingredients.length > 0 && (
                <p className="mt-[0.6mm] mb-0 text-[7.5pt] tracking-[0.04em] text-[#8a8177]">
                    {product.ingredients.join(' · ')}
                </p>
            )}

            {sizes.length > 0 && (
                <ul className="mt-[1mm] mb-0 list-none p-0 pl-[5mm] text-[8.5pt] text-[#3d372f]">
                    {sizes.map((size) => (
                        <li
                            key={size.name}
                            className="line flex items-baseline gap-[1.5mm]"
                        >
                            <span>{size.name}</span>
                            <span className="leader" />
                            <span className="whitespace-nowrap tabular-nums">
                                {size.discountPrice !== null && (
                                    <span className="mr-[1.5mm] text-[#8a8177] line-through">
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

/** The switches. Screen only — none of this survives onto the paper. */
function Controls({
    options,
    set,
    dishes,
    label,
    saving,
    failed,
    onDownload,
}: {
    options: Options;
    set: <K extends keyof Options>(key: K, value: Options[K]) => void;
    dishes: number;
    label: string;
    saving: boolean;
    failed: boolean;
    onDownload: () => void;
}) {
    return (
        <aside className="controls sticky top-8 w-full shrink-0 border-b border-[#d0cac1] bg-white p-6 lg:w-72 lg:rounded-2xl lg:border lg:shadow-sm">
            <h1 className="text-base font-semibold uppercase">The menu, set</h1>
            <p className="mt-1 text-xs text-[#6b6259]">
                Set the sheet, then save it. The picture comes out at roughly
                300&nbsp;dpi — sharp enough to print, small enough to send on
                WhatsApp.
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

                <div className="flex flex-col gap-2">
                    <span className="text-[0.65rem] tracking-[0.18em] text-[#6b6259] uppercase">
                        Include
                    </span>

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
            </div>

            {/* The picture is the way out, so it is the button. It downloads
                on the press with no dialog in between, which is the whole
                difference between this and printing. */}
            <button
                type="button"
                onClick={onDownload}
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#16130f] px-4 py-3 text-sm font-semibold text-white uppercase transition-transform duration-200 ease-out hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-[#16130f]/30 focus-visible:outline-none active:scale-[0.99] disabled:scale-100 disabled:opacity-60"
            >
                {saving ? (
                    <LoaderCircle aria-hidden className="size-4 animate-spin" />
                ) : (
                    <Download aria-hidden className="size-4" />
                )}
                {saving ? 'Drawing…' : 'Download image'}
            </button>

            {/* Still here, quietly, for whoever wants paper or a PDF — the
                browser's own print is the best PDF writer on the machine, and
                there is no reason to hide it. */}
            <button
                type="button"
                onClick={() => window.print()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[#d0cac1] px-4 py-2.5 text-xs font-semibold text-[#3d372f] uppercase transition-colors duration-200 ease-out hover:bg-[#f0ede8] focus-visible:ring-3 focus-visible:ring-[#16130f]/20 focus-visible:outline-none"
            >
                <Printer aria-hidden className="size-3.5" />
                Print or save as PDF
            </button>

            <p className="mt-3 text-center text-[0.7rem] text-[#6b6259]">
                {failed
                    ? 'That did not work — try the print button instead.'
                    : `${dishes === 1 ? '1 dish' : `${dishes} dishes`} on the ${label} menu`}
            </p>
        </aside>
    );
}

/** A row of mutually exclusive buttons, which beats a select for two or three. */
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
                                ? 'flex-1 rounded-full bg-[#16130f] px-3 py-2 text-xs font-semibold text-white'
                                : 'flex-1 rounded-full bg-[#f0ede8] px-3 py-2 text-xs font-medium text-[#3d372f] hover:bg-[#e5e0d9]'
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
            {label}
        </label>
    );
}

/**
 * What Tailwind cannot say.
 *
 * `@page` has no utility, and neither do column rules or the dotted leader that
 * fills whatever space is left between a dish and its price. The print block is
 * what turns the screen layout into a sheet: the controls go, the paper's own
 * shadow and margins go, and what is left is the page.
 */
const PRINT_CSS = `
    @page { size: A4; margin: 14mm 14mm 16mm; }

    .sheet {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 9.5pt;
        line-height: 1.3;
    }

    .columns { column-gap: 12mm; }

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
        border-top: 0.5pt solid #c9c2b8;
    }

    /* The classic leader: the name and the price are the ends of the row and
       the dots are whatever is left between them, so they always meet however
       long the name runs. */
    .leader {
        flex: 1;
        border-bottom: 0.5pt dotted #b3aa9e;
        transform: translateY(-1mm);
    }

    /* Everything the screen puts around the sheet has to be taken back off it
       before it reaches paper — and with !important, because these are fighting
       Tailwind utilities on the same elements.

       The wrapper's own background is the one that matters: left alone, its
       beige prints as a field of ink behind every page. */
    @media print {
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .shell {
            display: block !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            gap: 0 !important;
        }

        .controls { display: none !important; }

        .sheet {
            width: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
        }
    }
`;
