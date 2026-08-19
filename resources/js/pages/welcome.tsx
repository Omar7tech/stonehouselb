import { Head } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-6">
                <img
                    src="/logos/logo.svg"
                    alt="Stone House"
                    className="w-full max-w-md sm:max-w-xl lg:max-w-2xl"
                />

                <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center">
                    <Button size="lg" className="h-12 px-8 text-base sm:flex-1">
                        Dine In
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 text-base sm:flex-1"
                    >
                        Delivery
                    </Button>
                </div>
            </div>
        </>
    );
}
