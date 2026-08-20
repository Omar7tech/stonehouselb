import inertia from '@inertiajs/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny, local } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                // Body text. Only the two weights the UI actually uses, so the
                // preload budget isn't spent on a weight nothing renders.
                bunny('Inter', {
                    weights: [400, 500],
                }),
                // Display face, run through the same pipeline as the remote
                // font so it is hashed, its @font-face lands inline in <head>,
                // and it gets preloaded instead of waiting on the CSS parse.
                local('StretchPro', {
                    src: 'resources/fonts/StretchPro.woff2',
                }),
            ],
        }),
        inertia({ssr: false}),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
});
