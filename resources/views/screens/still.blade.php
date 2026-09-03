<!DOCTYPE html>
<html lang="en">
<head>
    @include('screens.partials.head')
</head>

{{--
    The still board: the whole menu, printed once, and then nothing.

    No timer, no script, no transition — the page is drawn and the set is left
    alone with it. It is the board to reach for when a television has been
    freezing or blanking on the others, because there is nothing here left to
    fail: if the page arrived, it is right, and it stays right until the meta
    refresh fetches it again.

    Long menus will run off the bottom of the screen. That is the honest
    trade — and the reason the cycling and crawling boards exist beside it.
--}}
<body>
    <div class="frame">
        <div class="head">
            <p class="shop">{{ $shopName }}</p>
        </div>

        @forelse ($categories as $category)
            <div style="margin-bottom: 30px;">
                <h2 class="category">{{ $category['name'] }}</h2>

                @include('screens.partials.dishes', ['products' => $category['products']])
            </div>
        @empty
            <p class="empty">Nothing on the menu yet.</p>
        @endforelse
    </div>
</body>
</html>
