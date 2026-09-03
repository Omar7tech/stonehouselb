import { ArrowUpRight } from 'lucide-react';

import { CategoryArt } from '@/components/menu/category-art';
import { useUppercaseCategoryTitles } from '@/lib/title-case';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * One category as a bento tile, in one of two shapes.
 *
 * A `wide` tile spans both columns and lays the name against the art side by
 * side; a plain one is square and stacks them. Neither centres its name — the
 * text is set hard into the bottom-left corner, so a wall of tiles has one
 * straight edge to read down rather than a name floating in the middle of every
 * box.
 *
 * The numeral behind the art is the tile's place in the wall, ghosted into the
 * orange. It is what keeps a large tile from reading as an empty one: a bento
 * needs its big cells to carry something, and a number is the one thing every
 * category has without anyone typing it.
 */
export function CategoryTile({
    category,
    index,
    wide,
    onSelect,
}: {
    category: Category;
    /** Position in the wall, drawn as the ghosted numeral. */
    index: number;
    /** Whether this tile spans both columns and lays out side by side. */
    wide: boolean;
    onSelect: (id: number) => void;
}) {
    const uppercase = useUppercaseCategoryTitles();

    return (
        <button
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
                'group relative overflow-hidden rounded-3xl bg-primary p-4 text-left text-primary-foreground',
                'shadow-[0_2px_8px_rgb(249_159_62/0.3)] hover:shadow-[0_12px_24px_rgb(249_159_62/0.42)]',
                'transition-[translate,scale,box-shadow] duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.97] motion-reduce:translate-none motion-reduce:scale-100',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
                wide
                    ? cn(
                          'col-span-2 flex aspect-[2/1] flex-row-reverse items-center gap-4 sm:aspect-[3/1]',
                          // At `lg` a wide tile no longer owns its row — it sits
                          // beside two squares, and those squares are what set
                          // the row's height. Holding an aspect ratio here would
                          // draw the tile shorter than the row it is in and leave
                          // the slab hanging with a band of nothing under it, so
                          // the ratio is dropped and the grid's own stretch fills
                          // the height instead.
                          //
                          // The floor is for the one case that stretch cannot
                          // size: a wide tile that falls last, with no square
                          // beside it to take the height from. Then the row is
                          // only as tall as its contents, and this keeps it a
                          // band rather than a strip.
                          'lg:aspect-auto lg:min-h-40',
                      )
                    : 'flex aspect-square flex-col',
            )}
        >
            {/* Cropped by the tile on two sides, so it reads as set into the
                slab rather than printed on it. `tabular-nums` keeps 01 and 11
                the same width, or the wall's numerals wander. */}
            <span
                aria-hidden
                className="absolute -top-3 -left-1 font-display text-6xl leading-none text-primary-foreground/10 tabular-nums select-none sm:text-7xl"
            >
                {String(index + 1).padStart(2, '0')}
            </span>

            <ArrowUpRight
                aria-hidden
                className="absolute top-3 right-3 size-4 text-primary-foreground/55 transition-[translate,color] duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-foreground motion-reduce:translate-none"
                strokeWidth={2.5}
            />

            {/* `min-h-0` / `min-w-0` so the art surrenders its share of the tile
                to a two-line name instead of pushing it out of the slab. */}
            <span
                className={cn(
                    'relative flex items-center justify-center',
                    wide ? 'h-full min-w-0 flex-1' : 'min-h-0 w-full flex-1',
                )}
            >
                <CategoryArt
                    category={category}
                    className="max-h-full"
                    logoClassName={wide ? 'w-4/5' : 'w-3/4'}
                    imageClassName={
                        wide
                            ? 'aspect-square w-[80%] max-w-28'
                            : 'aspect-square w-[70%] max-w-32'
                    }
                />
            </span>

            {/* Bottom-left in both shapes: it is the one line the whole wall is
                meant to be read down. */}
            <span
                className={cn(
                    'relative line-clamp-2 text-sm leading-tight font-semibold tracking-wide text-balance',
                    uppercase && 'uppercase',
                    wide ? 'min-w-0 flex-1 sm:text-lg' : 'mt-2 sm:text-base',
                )}
            >
                {category.name}
            </span>
        </button>
    );
}
