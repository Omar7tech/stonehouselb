import type { Auth } from '@/types/auth';
import type {
    CategoryLayout,
    Checkout,
    Pricing,
    ProductCardStyle,
    SocialLink,
    VariantStyle,
} from '@/types/menu';
import type { Shop } from '@/types/shop';

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
            /** The title and description the server resolved for this route. */
            seo: { title: string; description: string };
            /** The line for the strip above the header. Null leaves it out. */
            banner: string | null;
            pricing: Pricing;
            checkout: Checkout;
            /** Whether the shop is open, and the schedule to re-check against. */
            shop: Shop;
            /** How the landing view draws its category boxes. */
            categoryLayout: CategoryLayout;
            /** How a product's sizes are offered on the card and in the sheet. */
            variantStyle: VariantStyle;
            /** How one product is drawn in an open category. */
            productCardStyle: ProductCardStyle;
            /** Whether category names are drawn in capitals. */
            uppercaseCategoryTitles: boolean;
            /** Whether product names are drawn in capitals. */
            uppercaseProductTitles: boolean;
            /** The footer's links. Empty leaves the list out entirely. */
            socialLinks: SocialLink[];
            /** Map link for the footer's location button. Null leaves it out. */
            locationUrl: string | null;
            /** Null when orders have nowhere to go, which closes checkout. */
            whatsappNumber: string | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
