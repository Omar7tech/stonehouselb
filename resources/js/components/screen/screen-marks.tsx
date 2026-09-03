import { Flame, Leaf, Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * The three things a board can say about a dish without words: it is the house
 * pick, it is hot, it is vegan.
 *
 * Icons rather than labels, because they survive the distance a board is read
 * from and they need no translation at a table of four nationalities. Each one
 * still carries a real label for anyone reading the page with anything but
 * their eyes.
 */
export function ScreenMarks({
    product,
    scale = 1,
    className,
}: {
    product: Product;
    scale?: number;
    className?: string;
}) {
    const marks = [
        product.isFeatured && {
            icon: Star,
            label: 'House favourite',
            tone: 'text-primary',
        },
        product.isSpicy && { icon: Flame, label: 'Spicy', tone: 'text-spicy' },
        product.isVegan && { icon: Leaf, label: 'Vegan', tone: 'text-vegan' },
    ].filter((mark) => mark !== false);

    if (marks.length === 0) {
        return null;
    }

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-[0.3em]',
                className,
            )}
        >
            {marks.map(({ icon: Icon, label, tone }) => (
                <Icon
                    key={label}
                    aria-label={label}
                    role="img"
                    className={tone}
                    strokeWidth={2.5}
                    style={{
                        width: `calc(var(--u) * ${scale})`,
                        height: `calc(var(--u) * ${scale})`,
                    }}
                />
            ))}
        </span>
    );
}
