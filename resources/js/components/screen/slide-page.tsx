import { ProductLeadPrice } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import type { Slide } from '@/types';

/**
 * A promotion, dealt in between the categories.
 *
 * The same slides the carousel above the menu runs, so a shop writes an offer
 * once and it appears on the website and on every screen in the room. Given the
 * whole page rather than a corner of one: an offer that has to compete with a
 * price list is an offer nobody reads.
 */
export function SlidePage({ slide }: { slide: Slide }) {
    const caption = slide.text ?? slide.product?.name ?? null;

    return (
        <div className="relative h-full w-full overflow-hidden">
            {slide.image === null ? (
                <div className="absolute inset-0 bg-primary" />
            ) : (
                <SmartImage
                    src={slide.image}
                    alt={caption ?? 'Offer'}
                    loading="eager"
                    className="absolute inset-0 h-full w-full"
                    imgClassName="h-full w-full object-cover"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            {caption !== null && (
                <>
                    {/* Only where there is a picture to darken. A lettered slide
                        is already the house orange, and a black wash over it
                        would leave it neither one thing nor the other. */}
                    {slide.image !== null && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 via-40% to-transparent" />
                    )}

                    <div
                        className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[2em] p-[3em]"
                        style={{ fontSize: 'var(--u)' }}
                    >
                        <p
                            className="max-w-[24em] leading-[0.95] font-semibold text-balance uppercase"
                            style={{ fontSize: 'calc(var(--u) * 3.6)' }}
                        >
                            {caption}
                        </p>

                        {slide.product && (
                            <ProductLeadPrice
                                product={slide.product}
                                scale={2}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
