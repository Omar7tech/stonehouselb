import { Head, usePage } from '@inertiajs/react';

/**
 * The tab title and description for the page being viewed.
 *
 * The app renders without SSR, so the head a crawler reads is written on the
 * server — meta, Open Graph and the schema.org graph all come down in the first
 * HTML response. The title is the one piece that has to keep changing as the
 * customer moves around, so it is taken from the same server-resolved copy
 * rather than written again here; the two cannot drift apart.
 */
export function PageHead() {
    const { seo } = usePage().props;

    return (
        <Head title={seo.title}>
            <meta name="description" content={seo.description} />
        </Head>
    );
}
