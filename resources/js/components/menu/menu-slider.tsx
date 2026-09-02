import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { SmartImage } from '@/components/smart-image';
import { StretchText } from '@/components/stretch';
import { cn } from '@/lib/utils';
import type { Slide } from '@/types';

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
 * The row is Embla's, so a finger swipes it and a mouse drags it; the arrows
 * are for the desk, where there is nothing to swipe with.
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

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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
            {/* The padding is for the lift the cards take on hover, which would
                otherwise be clipped off by the viewport's own overflow. */}
            <div ref={emblaRef} className="overflow-hidden py-1 select-none">
                <ul className="-ml-3 flex">
                    {slides.map((slide, index) => (
                        <li
                            key={slide.id}
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${slides.length}`}
                            className="min-w-0 flex-[0_0_100%] pl-3 sm:flex-[0_0_66%] lg:flex-[0_0_50%] xl:flex-[0_0_33.333%]"
                        >
                            <SlideCard slide={slide} onOpen={onOpen} />
                        </li>
                    ))}
                </ul>
            </div>

            {snaps.length > 1 && (
                <>
                    {/* Desk only: a phone has the whole card to swipe and no
                        cursor to reach a 36px target with. Laid over the
                        pictures rather than under them, so the row keeps its
                        full width for the artwork. */}
                    <Arrow side="left" onClick={scrollPrev} />
                    <Arrow side="right" onClick={scrollNext} />

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
                </>
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

    const caption =
        slide.product !== null || slide.text !== null ? (
            <span
                className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-3',
                    // The wash is only needed over a photograph; the lettered
                    // card is already a flat colour chosen to read against.
                    slide.image !== null &&
                        'bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-10',
                )}
            >
                {slide.product !== null && (
                    // The dish's name on the brand orange, with the chevron
                    // that says this one goes somewhere. It is the same shape
                    // as the pills above the products, so a customer who has
                    // used the menu already knows what it does.
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary px-3 py-1 font-display text-[0.7rem] text-primary-foreground uppercase shadow-sm">
                        <StretchText className="truncate">
                            {slide.product.name}
                        </StretchText>
                        <ChevronRight
                            aria-hidden
                            className="size-3.5 shrink-0"
                        />
                    </span>
                )}

                {slide.text !== null && (
                    <span
                        className={cn(
                            'text-sm font-semibold',
                            slide.image === null
                                ? 'text-foreground'
                                : 'text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.7)]',
                        )}
                    >
                        {slide.text}
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

/** One of the two desk-only arrows, hung off the middle of the row's edge. */
function Arrow({
    side,
    onClick,
}: {
    side: 'left' | 'right';
    onClick: () => void;
}) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === 'left' ? 'Previous slide' : 'Next slide'}
            className={cn(
                // Pinned against the top half of the row rather than its true
                // middle: the dots sit under the pictures, and centring on the
                // whole section would leave the arrows low on the artwork.
                'absolute top-[calc(50%-1rem)] hidden size-9 -translate-y-1/2 items-center justify-center rounded-full',
                'bg-surface/90 text-primary shadow-md backdrop-blur-sm transition-colors duration-200 ease-out',
                'hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:flex',
                side === 'left' ? 'left-2' : 'right-2',
            )}
        >
            <Icon className="size-5" />
        </button>
    );
}
