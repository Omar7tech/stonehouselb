import useEmblaCarousel from 'embla-carousel-react';
import { Plus } from 'lucide-react';

import { ProductImage } from '@/components/menu/product-image';
import { useCart } from '@/contexts/cart-context';
import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';

/**
 * What's in the order so far, across the top of the menu.
 *
 * It runs the full width of the page and drags sideways — a half-cut tile at
 * the right edge is what tells you there is more in there, so a long order
 * needs no arrows and no second screen to look at. Pressing a tile opens the
 * checkout.
 *
 * It stays put on an empty order rather than unmounting: the space is where the
 * order lives, and a card that appears out of nowhere on the first add shoves
 * the whole menu down the page as you are reaching for it. Empty, it holds its
 * own height and says what it is for.
 */

/**
 * How far the card's white carries on below the tiles, for the products panel
 * to sit on top of. It is drawn out of flow, so this is a purely visual number:
 * raising it slides more white behind the panel and cannot move anything on the
 * page, whatever the rest of the layout is doing.
 */
const SHEET_BLEED = '-12rem';

/** How many outlines to draw while the order is empty. */
const GHOST_TILES = 4;

/**
 * The name line's exact height: `text-[0.7rem]` at the default `leading-normal`
 * of 1.5. Pinned so an empty tile stands as tall as a full one and the first
 * item added doesn't move the page.
 */
const NAME_LINE_HEIGHT = 'h-[1.05rem]';

export function CartStrip() {
    const { items, count, subtotalUsd, setOpen } = useCart();
    const pricing = usePricing();

    const [emblaRef] = useEmblaCarousel({
        dragFree: true,
        align: 'start',
        containScroll: 'trimSnaps',
    });

    const isEmpty = items.length === 0;

    return (
        <section aria-label="Your order" className="relative">
            {/* The card itself, behind its own contents. Everything below is
                laid out from the tiles alone, so this can reach as far down as
                the design wants without any sibling having to know. */}
            <div
                aria-hidden
                style={{ bottom: SHEET_BLEED }}
                className="absolute inset-x-0 top-0 rounded-3xl bg-card shadow-lg"
            />

            {/* The top padding is what keeps the corner badges out of the
                carousel's clipping; the foot only has to clear the rule below. */}
            <div
                ref={emblaRef}
                className="relative overflow-hidden pt-4 pb-3 select-none"
            >
                <ul className="flex pl-4">
                    {isEmpty
                        ? Array.from({ length: GHOST_TILES }, (_, index) => (
                              <li
                                  key={index}
                                  aria-hidden
                                  className="shrink-0 pr-3"
                                  style={{
                                      // The outlines fade as they run off, so
                                      // the row reads as one that carries on
                                      // rather than four things in a line.
                                      opacity: 1 - index * 0.22,
                                  }}
                              >
                                  <div className="w-24 rounded-lg border border-dashed border-foreground/15 px-2 pt-3 pb-2">
                                      <div className="mx-auto flex aspect-square w-full items-center justify-center rounded-2xl bg-muted/40">
                                          <Plus
                                              className="size-5 text-muted-foreground/40"
                                              strokeWidth={2.5}
                                          />
                                      </div>

                                      <div
                                          className={cn(
                                              'mt-1.5 flex items-center justify-center',
                                              NAME_LINE_HEIGHT,
                                          )}
                                      >
                                          <span className="h-2 w-12 rounded-full bg-muted" />
                                      </div>
                                  </div>
                              </li>
                          ))
                        : items.map((item, index) => (
                              <li
                                  key={item.key}
                                  className={cn(
                                      'shrink-0 pr-3',
                                      // The trailing gutter has to sit inside
                                      // the last tile: Embla measures its
                                      // scroll limit from the slides, so
                                      // padding on the track would never be
                                      // reachable.
                                      index === items.length - 1 && 'pr-4',
                                  )}
                              >
                                  <button
                                      type="button"
                                      onClick={() => setOpen(true)}
                                      aria-label={`${item.name}, ${item.quantity} in your order. Open checkout.`}
                                      className="relative w-24 rounded-lg bg-muted/60 px-2 pt-3 pb-2 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transform-none"
                                  >
                                      {/* Centred on the corner itself — half on
                                          the tile, half off it — not tucked
                                          inside. */}
                                      <span
                                          aria-hidden
                                          className="absolute top-0 left-0 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground tabular-nums"
                                      >
                                          {item.quantity}
                                      </span>

                                      <ProductImage
                                          product={item}
                                          className="mx-auto aspect-square w-full"
                                      />

                                      {/* Body face, as on the product cards. */}
                                      <p
                                          className={cn(
                                              'mt-1.5 truncate text-center text-[0.7rem] font-medium uppercase',
                                              NAME_LINE_HEIGHT,
                                          )}
                                      >
                                          {item.name}
                                      </p>
                                  </button>
                              </li>
                          ))}
                </ul>
            </div>

            {/* What the tiles come to, ruled off from them. The rule is inset
                by the same gutter the tiles start at, so it reads as the foot
                of this card rather than as a line drawn across the page.

                It sits above the panel's overlap, in the band of the card that
                is actually on show — anything lower would be hidden behind the
                menu. */}
            <div className="relative mx-4 flex items-baseline justify-between gap-3 border-t border-foreground/10 pt-2.5 pb-4">
                <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">
                    {isEmpty
                        ? 'Your order'
                        : count === 1
                          ? '1 item'
                          : `${count} items`}
                </span>

                {isEmpty ? (
                    /* Says what to do rather than quoting a total of nothing —
                       "$0.00" is a price, and there is no order to price yet. */
                    <span className="text-[0.7rem] text-muted-foreground">
                        Tap + on anything to start
                    </span>
                ) : (
                    /* Both currencies stack when the shop shows both, the way
                       the product cards set their prices. In a single-currency
                       shop `primary` is already the one to lead with, so the
                       second line only appears when there really is one. */
                    <span className="flex flex-col items-end leading-tight">
                        <span className="text-base font-semibold text-primary tabular-nums">
                            {pricing.primary(subtotalUsd)}
                        </span>

                        {pricing.showUsd && pricing.showLbp && (
                            <span className="text-[0.7rem] text-primary/60 tabular-nums">
                                {pricing.lbp(subtotalUsd)}
                            </span>
                        )}
                    </span>
                )}
            </div>
        </section>
    );
}
