{{--
    The head every plain board shares.

    Deliberately joyless: no bundle, no webfont, no viewport-relative units, no
    custom properties, no flexbox and no grid. A 2013 television renders this
    exactly as a 2026 one does, because there is nothing in it that a browser of
    that age had not already shipped.

    The reload is a meta refresh rather than a timer, because it is the one
    reload that cannot be broken by a page whose JavaScript has fallen over —
    and on these sets, sooner or later, it does.
--}}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{{ $screen->name }} — {{ $shopName }}</title>

@if ($refreshMinutes !== null)
    <meta http-equiv="refresh" content="{{ $refreshMinutes * 60 }}">
@endif

<style type="text/css">
    /* Dark by default: a bright screen in a lit room is a lamp, and a board is
       read all evening. The orange is the shop's own, hard-coded because a
       custom property is exactly the kind of thing these sets do not have. */
    html, body {
        margin: 0;
        padding: 0;
        background: #0d0d0d;
        color: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        -webkit-text-size-adjust: 100%;
    }

    /* Overscan: older sets crop the edges of the picture, so nothing that has
       to be read may sit within a few percent of the edge. */
    .frame {
        padding: 3% 4%;
    }

    .head {
        border-bottom: 3px solid #f99f3e;
        padding-bottom: 12px;
        margin-bottom: 24px;
    }

    .shop {
        color: #f99f3e;
        font-size: 34px;
        font-weight: bold;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin: 0;
    }

    .category {
        color: #f99f3e;
        font-size: 30px;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 0 0 14px;
    }

    /* A table, not columns: floats drop and collapse on these browsers, and a
       menu that drops a price onto the next line is worse than a plain one. */
    table.dishes {
        width: 100%;
        border-collapse: collapse;
    }

    table.dishes td {
        padding: 9px 0;
        border-bottom: 1px solid #262626;
        vertical-align: top;
    }

    td.dish {
        font-size: 26px;
        font-weight: bold;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .note {
        display: block;
        color: #9a9a9a;
        font-size: 17px;
        font-weight: normal;
        letter-spacing: 0;
        text-transform: none;
        margin-top: 3px;
    }

    td.cost {
        font-size: 26px;
        font-weight: bold;
        text-align: right;
        white-space: nowrap;
        color: #f99f3e;
    }

    .size {
        color: #cfcfcf;
        font-size: 17px;
        font-weight: normal;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding-right: 10px;
    }

    .was {
        color: #7a7a7a;
        font-size: 17px;
        font-weight: normal;
        text-decoration: line-through;
        padding-right: 8px;
    }

    .empty {
        color: #9a9a9a;
        font-size: 22px;
    }
</style>
