import { Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import { StoneHouseLogo } from '@/components/stone-house-logo';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-6">
                <StoneHouseLogo className="w-full max-w-md select-none sm:max-w-xl lg:max-w-2xl" />

                {/* From `sm` up the pair lines up under the logo and shares its
                    width, so the two read as one block. */}
                <div className="flex w-full max-w-md animate-in flex-col gap-3 delay-1100 duration-450 ease-out fill-mode-backwards fade-in slide-in-from-bottom-4 motion-reduce:animate-none sm:max-w-xl sm:flex-row sm:gap-4 lg:max-w-2xl">
                    <Button
                        size="lg"
                        className="h-12 justify-start px-5 font-display text-3xl uppercase sm:h-16 sm:flex-1 sm:text-2xl lg:h-20 lg:text-3xl"
                    >
                        Dine In
                        <ArrowRight className="ml-auto size-7 sm:size-8" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-12 justify-start px-5 font-display text-3xl uppercase sm:h-16 sm:flex-1 sm:text-2xl lg:h-20 lg:text-3xl"
                    >
                        Delivery
                        <ArrowRight className="ml-auto size-7 sm:size-8" />
                    </Button>
                </div>
            </div>
        </>
    );
}
