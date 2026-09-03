{{--
    One category's dishes as a table: the name on the left, every price it is
    sold at on the right. A dish with sizes prints one row per size, so the
    figures stay in one column down the board rather than running along the
    line as a sentence.
--}}
<table class="dishes" cellspacing="0" cellpadding="0">
    @foreach ($products as $product)
        @php($lines = $product['prices'] === [] ? [null] : $product['prices'])

        @foreach ($lines as $index => $line)
            <tr>
                @if ($index === 0)
                    <td class="dish" rowspan="{{ count($lines) }}">
                        {{ $product['name'] }}

                        @if (! empty($product['note']))
                            <span class="note">{{ \Illuminate\Support\Str::limit($product['note'], 90) }}</span>
                        @endif
                    </td>
                @endif

                <td class="cost">
                    @if ($line !== null)
                        @if (! empty($line['label']))
                            <span class="size">{{ $line['label'] }}</span>
                        @endif

                        @if (! empty($line['was']))
                            <span class="was">{{ $line['was'] }}</span>
                        @endif

                        {{ $line['amount'] }}
                    @endif
                </td>
            </tr>
        @endforeach
    @endforeach
</table>
