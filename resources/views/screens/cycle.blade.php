<!DOCTYPE html>
<html lang="en">
<head>
    @include('screens.partials.head')

    <style type="text/css">
        .page {
            display: none;
        }

        .page.on {
            display: block;
        }

        /* The tally of pages, so somebody standing at the counter can see the
           board is cycling rather than stuck. Absolute rather than fixed:
           `position: fixed` is where a lot of these browsers give up. */
        .dots {
            position: absolute;
            right: 4%;
            bottom: 3%;
        }

        .dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-left: 8px;
            background: #3a3a3a;
        }

        .dot.on {
            background: #f99f3e;
        }
    </style>
</head>

{{--
    The cycling board: one category at a time, changed on a timer.

    For the menu too long to print at a size anyone can read from across the
    room. The whole menu is in the page from the start — every category is
    rendered and then hidden — so the swap is one `display` change and the set
    never fetches anything again between refreshes.

    The script is ES5 on purpose: `var`, no arrow functions, no `classList`, no
    `querySelectorAll` on anything exotic. It also guards itself — if the timer
    dies, the page is left showing a real category rather than a blank screen,
    and the meta refresh in the head eventually brings the whole thing back.
--}}
<body>
    <div class="frame">
        <div class="head">
            <p class="shop">{{ $shopName }}</p>
            <p class="board-name">{{ $screen->name }}</p>
        </div>

        @forelse ($categories as $index => $category)
            <div class="page{{ $index === 0 ? ' on' : '' }}" id="page-{{ $index }}">
                <h2 class="category">{{ $category['name'] }}</h2>

                @include('screens.partials.dishes', ['products' => $category['products']])
            </div>
        @empty
            <p class="empty">Nothing on the menu yet.</p>
        @endforelse
    </div>

    @if (count($categories) > 1)
        <div class="dots" id="dots">
            @foreach ($categories as $index => $category)
                <span class="dot{{ $index === 0 ? ' on' : '' }}" id="dot-{{ $index }}"></span>
            @endforeach
        </div>
    @endif

    <script type="text/javascript">
        (function () {
            var total = {{ count($categories) }};
            var hold = {{ $holdSeconds }} * 1000;
            var current = 0;

            if (total < 2) {
                return;
            }

            function show(index) {
                var page = document.getElementById('page-' + index);
                var dot = document.getElementById('dot-' + index);

                if (page) {
                    page.className = index === current ? 'page on' : 'page';
                }

                if (dot) {
                    dot.className = index === current ? 'dot on' : 'dot';
                }
            }

            function tick() {
                current = (current + 1) % total;

                for (var i = 0; i < total; i++) {
                    show(i);
                }
            }

            setInterval(tick, hold);
        })();
    </script>
</body>
</html>
