import type { Auth } from '@/types/auth';
import type {
    CategoryLayout,
    Checkout,
    Pricing,
    SocialLink,
    VariantStyle,
} from '@/types/menu';

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
            /** How the landing view draws its category boxes. */
            categoryLayout: CategoryLayout;
            /** How a product's sizes are offered on the card and in the sheet. */
            variantStyle: VariantStyle;
            /** The footer's links. Empty leaves the list out entirely. */
            socialLinks: SocialLink[];
            /** Null when orders have nowhere to go, which closes checkout. */
            whatsappNumber: string | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
