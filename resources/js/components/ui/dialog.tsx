import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-scrim/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-scrim/65',
                className,
            )}
            {...props}
        />
    );
}

/**
 * Responsive dialog panel: a bottom sheet that slides up on mobile, a centred
 * modal from `sm` up. Rounded like the menu panel it opens over, and thrown
 * upwards for the same reason the panel is — the stock shadows fall downwards,
 * where there is nothing to catch them.
 */
function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal>
            <DialogOverlay />
            {/* Full-screen wrapper centres on desktop and bottom-aligns on
                mobile. It ignores pointer events so clicks outside the panel
                still reach the overlay and close. */}
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    className={cn(
                        'pointer-events-auto relative flex max-h-[88vh] w-full flex-col rounded-t-[2rem] bg-surface text-foreground shadow-[0_-6px_20px_rgb(0_0_0/0.11)] sm:max-w-lg sm:rounded-[2rem] sm:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]',
                        'duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                        className,
                    )}
                    {...props}
                >
                    {/* Grab handle, for the bottom-sheet feel on a phone. */}
                    <span
                        aria-hidden
                        className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-foreground/15 sm:hidden"
                    />

                    {children}

                    {showCloseButton && (
                        <DialogPrimitive.Close className="absolute top-3.5 right-3.5 z-10 inline-flex size-9 items-center justify-center rounded-full bg-card/85 text-foreground/70 backdrop-blur transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                            <X className="size-4" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                    )}
                </DialogPrimitive.Content>
            </div>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn('flex flex-col gap-1 text-left', className)}
            {...props}
        />
    );
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                'text-xl leading-tight font-semibold uppercase sm:text-2xl',
                className,
            )}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
