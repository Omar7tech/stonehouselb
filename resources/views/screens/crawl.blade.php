<!DOCTYPE html>
<html lang="en">
<head>
    @include('screens.partials.head')

    <style type="text/css">
        html, body {
            overflow: hidden;
        }

        /* The heading stays; only the menu under it moves. Absolute rather
           than fixed, and given the page's own background, so the crawl passes
           behind it rather than through it. */
        .banner {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 2;
            background: #0d0d0d;
            padding: 2% 4% 0;
        }

        .window {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
        }

        .reel {
            position: relative;
            padding: 0 4%;
        }
    </style>
</head>

{{--
    The crawling board: the menu rolling slowly upwards, forever.

    This is the one for a menu that will not fit on a screen at any readable
    size and a shop that would rather not have the board blink between pages.
    The list is printed twice, one copy under the other, and the reel is moved
    up by a pixel at a time; when the first copy has gone past, the offset is
    reset to zero and the second copy is exactly where the first was. The join
    is invisible and the loop is seamless.

    `top` is moved rather than a transform, because CSS transforms on these
    sets are either missing or a slideshow. A pixel every few dozen
    milliseconds is cheap enough that even a set with no compositor keeps up,
    and the speed is worked out from the shop's own hold setting: a longer hold
    means a slower crawl.
--}}
<body>
    <div class="banner" id="banner">
        <div class="head">
            <p class="shop">{{ $shopName }}</p>
            <p class="board-name">{{ $screen->name }}</p>
        </div>
    </div>

    <div class="window" id="window">
        <div class="reel" id="reel">
            @for ($copy = 0; $copy < 2; $copy++)
                <div @if ($copy === 0) id="run" @endif>
                    @forelse ($categories as $category)
                        <div style="margin-bottom: 30px;">
                            <h2 class="category">{{ $category['name'] }}</h2>

                            @include('screens.partials.dishes', ['products' => $category['products']])
                        </div>
                    @empty
                        <p class="empty">Nothing on the menu yet.</p>
                    @endforelse
                </div>
            @endfor
        </div>
    </div>

    <script type="text/javascript">
        (function () {
            var reel = document.getElementById('reel');
            var run = document.getElementById('run');
            var banner = document.getElementById('banner');
            var window_ = document.getElementById('window');

            if (!reel || !run || !window_) {
                return;
            }

            // The heading is drawn over the top of the crawl, so the window
            // starts below it. Measured rather than guessed: the heading is two
            // lines on one screen and three on another.
            function place() {
                var top = banner ? banner.offsetHeight : 0;

                window_.style.top = top + 'px';
                window_.style.height = (document.documentElement.clientHeight - top) + 'px';
            }

            place();

            // A hold of 12 seconds crawls a screen's worth in about 12 seconds,
            // so the shop's one setting governs both boards the same way.
            var hold = {{ $holdSeconds }};
            var step = 1;
            var every = Math.max(Math.round((hold * 1000) / Math.max(document.documentElement.clientHeight, 1)), 16);
            var offset = 0;

            function tick() {
                var height = run.offsetHeight;

                if (height < 1) {
                    return;
                }

                offset = offset + step;

                if (offset >= height) {
                    offset = 0;
                }

                reel.style.top = '-' + offset + 'px';
            }

            setInterval(tick, every);

            // A set rotated, or a browser that reports its size late, would
            // otherwise crawl behind the heading or off the bottom.
            if (window.addEventListener) {
                window.addEventListener('resize', place, false);
            }
        })();
    </script>
</body>
</html>
