import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SmartImage } from '@/components/smart-image';
import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';
import type { Product, Slide } from '@/types';

/** How long a slide holds before the row moves itself on. */
const ADVANCE_AFTER_MS = 5000;

/**
 * The strip above the menu: whatever the shop is pushing this week, as wide
 * pictures that scroll sideways.
 *
 * A slide with a dish behind it opens that dish's sheet — the same sheet the
 * menu opens, so what is chosen there lands in the same basket by the same
 * route. A slide without one is a picture and nothing more: an opening-hours
 * notice has nothing to add to an order.
 *
 * It advances on its own, which is the whole point of a promotion — but it
 * stops the moment a pointer rests on it or the keyboard reaches into it, and
 * never starts at all for a customer who has asked their machine to hold still.
 * The row is Embla's, so a finger swipes it and a mouse drags it, and the dots
 * under it go straight to a slide for anyone who would rather aim than drag.
 */
export function MenuSlider({
    slides,
    onOpen,
    paused = false,
}: {
    slides: readonly Slide[];
    /** Opens the dish behind a slide. Only called for slides that have one. */
    onOpen: (slide: Slide) => void;
    /** Held still while something else has the screen, e.g. an open sheet. */
    paused?: boolean;
}) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
        containScroll: 'trimSnaps',
    });

    const [selectedSnap, setSelectedSnap] = useState(0);
    const [snaps, setSnaps] = useState<number[]>([]);
    // Set while a pointer is resting on the row or the keyboard is inside it —
    // both mean someone is reading this slide, and moving it on is taking it
    // away from them.
    const [held, setHeld] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    // Embla is imperative, so its layout is mirrored into state for the dots to
    // draw from and read once on mount for the position it starts at.
    useEffect(() => {
        if (!emblaApi) {
            return;
        }

        const sync = (): void => {
            setSnaps(emblaApi.scrollSnapList());
            setSelectedSnap(emblaApi.selectedScrollSnap());
        };

        emblaApi.on('select', sync);
        emblaApi.on('reInit', sync);
        sync();

        return () => {
            emblaApi.off('select', sync);
            emblaApi.off('reInit', sync);
        };
    }, [emblaApi]);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = (): void => setReducedMotion(query.matches);

        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, []);

    // `selectedSnap` is in here so the clock restarts whenever the row moves,
    // however it moved: a slide dragged into view gets its full time on screen
    // rather than whatever was left of the last one's.
    const canAdvance =
        emblaApi !== undefined &&
        snaps.length > 1 &&
        !held &&
        !paused &&
        !reducedMotion;

    useEffect(() => {
        if (!canAdvance) {
            return;
        }

        const timer = window.setInterval(() => {
            // Nothing to advance past on a tab nobody is looking at, and every
            // tick of it would be waiting to fire at once on the way back.
            if (!document.hidden) {
                emblaApi?.scrollNext();
            }
        }, ADVANCE_AFTER_MS);

        return () => window.clearInterval(timer);
    }, [emblaApi, canAdvance, selectedSnap]);

    if (slides.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Featured"
            aria-roledescription="carousel"
            className="relative flex flex-col gap-3"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
        >
            {/* Nothing across the sides of this box, on purpose. Embla decides
                when a slide has left the screen from the width it measures
                here, and it measures the content box — so side padding leaves a
                band that is visible but that Embla counts as off-screen, and a
                looping row hides a card there and whips it round to the other
                end while it is still being looked at.

                So the gutters go inside each slide instead, where they are part
                of the slot Embla is measuring and cannot lie to it. The row
                still runs to the true edge of the column; the card simply sits
                a few pixels inside its own slot.

                The vertical padding is safe — it is the lift the cards take on
                hover, which would otherwise be clipped off. */}
            <div ref={emblaRef} className="overflow-hidden py-1 select-none">
                <ul className="flex">
                    {slides.map((slide, index) => (
                        <li
                            key={slide.id}
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${slides.length}`}
                            className="min-w-0 flex-[0_0_100%] px-2 sm:flex-[0_0_66%] lg:flex-[0_0_50%] xl:flex-[0_0_33.333%]"
                        >
                            <SlideCard slide={slide} onOpen={onOpen} />
                        </li>
                    ))}
                </ul>
            </div>

            {/* The dots are the only control the row needs. Arrows were here
                for the desk, laid over the artwork, and they were in the way of
                the pictures they were meant to help you see — the row drags
                with a mouse as readily as it swipes with a finger, and a dot
                goes straight to a slide rather than one step towards it. */}
            {snaps.length > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    {snaps.map((snap, index) => (
                        <button
                            key={snap}
                            type="button"
                            onClick={() => emblaApi?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === selectedSnap}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-300 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                                index === selectedSnap
                                    ? 'w-6 bg-primary'
                                    : 'w-1.5 bg-primary/25 hover:bg-primary/50',
                            )}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

/**
 * One slide. A dish behind it makes the whole card the way in, so there is no
 * small "view" link to find — the same bargain the product cards strike.
 */
function SlideCard({
    slide,
    onOpen,
}: {
    slide: Slide;
    onOpen: (slide: Slide) => void;
}) {
    const shell =
        'relative block w-full overflow-hidden rounded-2xl bg-card shadow-sm';

    const picture =
        slide.image === null ? (
            /* Nothing to show, so the card becomes the message: a plate of the
               brand orange for the words to sit on, rather than a grey hole
               where a photograph was meant to be. */
            <span className="block aspect-[16/9] w-full bg-primary/10" />
        ) : (
            <SmartImage
                src={slide.image}
                alt={slide.product?.name ?? slide.text ?? 'Featured'}
                className="aspect-[16/9] w-full"
                imgClassName="object-cover transition-[scale] duration-500 ease-out group-hover:scale-[1.03] motion-reduce:scale-100"
                draggable={false}
            />
        );

    // Everything is drawn against the photograph, so the wash under it is what
    // makes any of it legible. The lettered card has no photograph to fight and
    // reads in the page's own ink instead.
    const onPhoto = slide.image !== null;

    const caption =
        slide.product !== null || slide.text !== null ? (
            <span
                className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-3 p-3.5 sm:p-4',
                    onPhoto &&
                        'bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-14',
                )}
            >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {/* The shop's own line leads, above the dish it is about:
                        "Two for one on Tuesdays" is the offer, and the name
                        under it is what the offer is on. */}
                    {slide.text !== null && (
                        <span
                            className={cn(
                                'line-clamp-2 text-xs font-medium',
                                onPhoto ? 'text-white/80' : 'text-primary',
                            )}
                        >
                            {slide.text}
                        </span>
                    )}

                    {slide.product !== null && (
                        <>
                            {/* Body face, as on the product cards, and for the
                                same reason: a dish's name is read, not
                                admired, and the display face is far too wide
                                to hold one at a size anybody can read. */}
                            <span
                                className={cn(
                                    'truncate text-base leading-tight font-semibold uppercase sm:text-lg',
                                    onPhoto ? 'text-white' : 'text-foreground',
                                )}
                            >
                                {slide.product.name}
                            </span>

                            <SlidePrice
                                product={slide.product}
                                onPhoto={onPhoto}
                            />
                        </>
                    )}
                </span>

                {/* What says the card goes somewhere, now that the name is
                    plain text rather than a pill. It is the quick add's shape
                    and colour turned into an arrow, so it reads as a way in
                    rather than as a button that adds something unseen. */}
                {slide.product !== null && (
                    <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-[scale] duration-200 ease-out group-hover:scale-110 motion-reduce:scale-100"
                    >
                        <ChevronRight className="size-4.5" strokeWidth={2.5} />
                    </span>
                )}
            </span>
        ) : null;

    if (slide.product === null) {
        return (
            <div className={shell}>
                {picture}
                {caption}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onOpen(slide)}
            aria-label={`View ${slide.product.name}`}
            className={cn(
                shell,
                'group cursor-pointer text-left transition-[translate] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:translate-none',
            )}
        >
            {picture}
            {caption}
        </button>
    );
}

/**
 * What the dish costs, under its name on the slide.
 *
 * A promotion that doesn't say the price is asking the customer to open the
 * sheet to find out, which is a tap spent on something the card could have
 * told them. Sizes are quoted from the cheapest and marked as such — a slide is
 * a poster, not a price list, and "from" is the honest way to put one figure on
 * a dish that has four.
 */
function SlidePrice({
    product,
    onPhoto,
}: {
    product: Product;
    /** Drawn over a photograph, so the ink is white rather than the page's. */
    onPhoto: boolean;
}) {
    const pricing = usePricing();
    const hasVariants = product.variants.length > 0;

    const price = hasVariants
        ? Math.min(
              ...product.variants.map(
                  (variant) => variant.discountPrice ?? variant.price,
              ),
          )
        : (product.discountPrice ?? product.price);

    // Only for a dish sold at one price: struck through beside a "from" figure,
    // the old price would read as the old price of the cheapest size, which is
    // not what it is.
    const wasPrice =
        !hasVariants && product.discountPrice !== null ? product.price : null;

    return (
        <span className="mt-0.5 flex min-w-0 items-baseline gap-2">
            {hasVariants && (
                <span
                    className={cn(
                        'shrink-0 text-[0.65rem] tracking-wide uppercase',
                        onPhoto ? 'text-white/60' : 'text-muted-foreground',
                    )}
                >
                    From
                </span>
            )}

            <span
                className={cn(
                    'truncate text-sm font-semibold tabular-nums',
                    onPhoto ? 'text-white' : 'text-primary',
                )}
            >
                {pricing.primary(price)}
            </span>

            {wasPrice !== null && (
                <span
                    className={cn(
                        'shrink-0 text-xs tabular-nums line-through',
                        onPhoto ? 'text-white/60' : 'text-muted-foreground',
                    )}
                >
                    {pricing.primary(wasPrice)}
                </span>
            )}
        </span>
    );
}
