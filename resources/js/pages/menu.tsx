import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

import { StoneWallBackdrop } from '@/components/stone-wall-backdrop';
import { Button } from '@/components/ui/button';
import type { OrderType } from '@/types';

interface MenuProps {
    orderType: OrderType;
    orderTypeLabel: string;
}

/**
 * Placeholder menu page. Both order types render this same page — the delivery
 * menu is the one that carries the cart, so anything ordering-related keys off
 * `orderType` rather than living on a second page.
 */
export default function Menu({ orderType, orderTypeLabel }: MenuProps) {
    const title = `${orderTypeLabel} Menu`;
    const isDelivery = orderType === 'delivery';

    return (
        <>
            <Head title={title} />
            <StoneWallBackdrop />

            <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
                <h1 className="font-display text-4xl uppercase sm:text-5xl lg:text-6xl">
                    {title}
                </h1>

                <p className="max-w-md text-muted-foreground">
                    {isDelivery
                        ? 'Delivery ordering is on the way. Browse, build a cart, and send it over — soon.'
                        : 'The dine-in menu is being set. Ask the counter for today’s board in the meantime.'}
                </p>

                <div className="flex flex-col items-center gap-3 sm:flex-row">
                    <Button asChild variant="outline" size="lg">
                        <Link href="/">
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>

                    {/* The one difference between the two menus: only delivery
                        gets a cart. Disabled until the products land. */}
                    {isDelivery && (
                        <Button size="lg" disabled>
                            <ShoppingBag />
                            Cart (0)
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
