import { Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import { StoneHouseLogo } from '@/components/stone-house-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Landing call-to-action. On hover the arrow rides out to the right and a
 * fresh copy takes its place from the left; the colours stay put.
 */
function ChoiceButton({
    label,
    outline = false,
}: {
    label: string;
    outline?: boolean;
}) {
    return (
        <Button
            size="lg"
            variant={outline ? 'outline' : 'default'}
            className={cn(
                'h-12 justify-start px-5 font-display text-3xl uppercase sm:h-16 sm:flex-1 sm:text-2xl lg:h-20 lg:text-3xl',
                // The arrow is the whole of the hover; the button's own colours
                // hold still, so the stock tint is cancelled out.
                outline
                    ? 'hover:bg-background hover:text-foreground'
                    : 'hover:bg-primary',
            )}
        >
            {label}
            <span className="relative ml-auto flex size-7 items-center justify-center overflow-hidden sm:size-8">
                <ArrowRight className="size-7 transition-transform duration-300 ease-out group-hover/button:translate-x-9 motion-reduce:transform-none sm:size-8" />
                <ArrowRight
                    aria-hidden
                    className="absolute size-7 -translate-x-9 transition-transform duration-300 ease-out group-hover/button:translate-x-0 motion-reduce:hidden sm:size-8"
                />
            </span>
        </Button>
    );
}

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-6">
                <StoneHouseLogo className="w-full max-w-md select-none sm:max-w-xl lg:max-w-2xl" />

                {/* From `sm` up the pair lines up under the logo and shares its
                    width, so the two read as one block. */}
                <div className="flex w-full max-w-md animate-in flex-col gap-3 delay-1100 duration-450 ease-out fill-mode-backwards fade-in slide-in-from-bottom-4 motion-reduce:animate-none sm:max-w-xl sm:flex-row sm:gap-4 lg:max-w-2xl">
                    <ChoiceButton label="Dine In" />
                    <ChoiceButton label="Delivery" outline />
                </div>
            </div>
        </>
    );
}
