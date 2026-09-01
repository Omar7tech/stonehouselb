import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface SmartImageProps {
    src: string;
    alt: string;
    /** Classes for the wrapper box (sizing, radius, any hover transform). */
    className?: string;
    /** Classes for the `<img>` itself (object-fit, shadow). */
    imgClassName?: string;
    /**
     * Classes for the panel the spinner sits on, which is where its colours
     * live. The default is drawn for a light card; anything standing on the
     * brand orange has to say so, or the mark is orange on orange.
     */
    spinnerClassName?: string;
    draggable?: boolean;
    loading?: 'lazy' | 'eager';
    /** Overlays rendered above the image, e.g. badges. */
    children?: ReactNode;
}

/**
 * An image that holds its space with a spinner while it loads, then fades in.
 * The wrapper takes the layout and sizing; the image fills it.
 *
 * Without this a photo simply pops into a gap that was empty a moment ago, and
 * on a slow connection a menu reads as broken rather than as loading — the
 * boxes are all there, and every one of them is missing its picture.
 */
export function SmartImage({
    src,
    alt,
    className,
    imgClassName,
    spinnerClassName,
    draggable,
    loading = 'lazy',
    children,
}: SmartImageProps) {
    const ref = useRef<HTMLImageElement>(null);
    const [loaded, setLoaded] = useState(false);

    // Reset on src change, but treat an already-cached image as loaded so the
    // spinner never flashes: a cached image is complete before React can
    // attach the handler, so its `onLoad` has already been and gone.
    useEffect(() => {
        setLoaded(ref.current?.complete ?? false);
    }, [src]);

    return (
        <span className={cn('relative block overflow-hidden', className)}>
            {!loaded && (
                <span
                    className={cn(
                        'absolute inset-0 grid place-items-center bg-primary/5 text-primary/40',
                        spinnerClassName,
                    )}
                >
                    <Loader2 className="size-5 animate-spin" />
                </span>
            )}

            <img
                ref={ref}
                src={src}
                alt={alt}
                draggable={draggable}
                loading={loading}
                decoding="async"
                onLoad={() => setLoaded(true)}
                // A photo that will not load is not worth a spinner that never
                // stops: the slot falls back to empty, which is what it would
                // have been anyway.
                onError={() => setLoaded(true)}
                className={cn(
                    'size-full transition-opacity duration-300',
                    !loaded && 'opacity-0',
                    imgClassName,
                )}
            />

            {children}
        </span>
    );
}
