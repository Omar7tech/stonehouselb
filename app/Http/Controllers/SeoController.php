<?php

namespace App\Http\Controllers;

use App\Support\Seo;
use Illuminate\Http\Response;

/**
 * The two files a crawler asks for before it reads a single page.
 *
 * Both are served from code rather than sat in `public/`, so every URL they
 * carry points at whatever domain the site is actually running on, and the
 * sitemap only ever lists pages that exist right now — a delivery menu switched
 * off in the dashboard leaves the sitemap the moment it is switched off.
 */
class SeoController extends Controller
{
    public function robots(Seo $seo): Response
    {
        return response(implode("\n", $seo->robotsLines()))
            ->header('Content-Type', 'text/plain; charset=UTF-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    public function sitemap(Seo $seo): Response
    {
        $lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ];

        foreach ($seo->sitemapPages() as $page) {
            $lines[] = '  <url>';
            $lines[] = '    <loc>'.e($page['loc']).'</loc>';

            if ($page['lastmod'] !== null) {
                $lines[] = '    <lastmod>'.e($page['lastmod']).'</lastmod>';
            }

            $lines[] = '    <changefreq>'.$page['changefreq'].'</changefreq>';
            $lines[] = '    <priority>'.$page['priority'].'</priority>';
            $lines[] = '  </url>';
        }

        $lines[] = '</urlset>';

        // Short-lived rather than uncached: the menu changes often enough that
        // a stale `lastmod` is worth avoiding, but a crawler re-fetching this
        // on every hit is pure load on a small host.
        return response(implode("\n", $lines)."\n")
            ->header('Content-Type', 'application/xml; charset=UTF-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
