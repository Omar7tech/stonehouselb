import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { cn } from '@/lib/utils';

/**
 * Stretch Pro draws its wide letterforms as `liga` ligatures on repeated
 * characters: `HH` renders one double-width H, `HHH` a triple, `HHHH` a quad.
 *
 * Since `liga` is on by default, any word with a naturally doubled letter
 * (BOOKING, SUCCESS) would stretch on its own. So `StretchText` turns
 * ligatures off across a block and `Stretch` turns them back on for the one
 * letter meant to be wide.
 *
 * @example
 * <StretchText as="h1" className="font-display text-4xl" aria-label="Choose">
 *     C<Stretch level={3}>H</Stretch>OOSE
 * </StretchText>
 */
type StretchTextProps = ComponentPropsWithoutRef<'span'> & {
    /** Element to render. Defaults to a span so it can wrap inline text. */
    as?: ElementType;
};

export function StretchText({
    as: Component = 'span',
    className,
    ...props
}: StretchTextProps) {
    return (
        <Component
            className={cn('[font-variant-ligatures:none]', className)}
            {...props}
        />
    );
}

type StretchProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
    /** The character to widen. */
    children: string;
    /**
     * How wide to go. The font draws each width as its own glyph, so these are
     * real letterforms rather than a scaled one.
     *
     * Coverage is not total: I, V, X and Y have no wide forms at all, their
     * lowercase counterparts are i, l, v and x, and F stops at level 3. A
     * missing level just renders as repeated letters, so check before shipping.
     */
    level?: 1 | 2 | 3 | 4;
};

export function Stretch({
    children,
    level = 2,
    className,
    ...props
}: StretchProps) {
    return (
        <span
            className={cn(
                '[font-variant-ligatures:common-ligatures]',
                className,
            )}
            {...props}
        >
            {children.repeat(level)}
        </span>
    );
}
