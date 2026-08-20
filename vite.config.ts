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
                //
                // The .woff2 is a subset of the .otf master beside it, cut down
                // to Latin plus Western European accents — the wide letterforms
                // are `liga` substitutions onto private-use glyphs, so the
                // subset keeps every layout feature or `Stretch` would break.
                // Regenerate with:
                //
                //   python -m fontTools.subset resources/fonts/StretchPro.otf \
                //     --output-file=resources/fonts/StretchPro.woff2 \
                //     --flavor=woff2 --layout-features='*' --no-hinting \
                //     --unicodes="U+0020-007E,U+00A0,U+00A9,U+00AE,U+00B0,U+00C0-00CF,U+00D1-00D6,U+00D9-00DC,U+00E0-00EF,U+00F1-00F6,U+00F9-00FC,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+20AC,U+2122"
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
