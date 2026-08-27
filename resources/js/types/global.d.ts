import type { Auth } from '@/types/auth';
import type { Checkout, Pricing, SocialLink } from '@/types/menu';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            pricing: Pricing;
            checkout: Checkout;
            /** The footer's links. Empty leaves the list out entirely. */
            socialLinks: SocialLink[];
            /** Null when orders have nowhere to go, which closes checkout. */
            whatsappNumber: string | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
