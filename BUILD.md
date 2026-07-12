# Building country pages

Country landing pages are generated from **one template** (the `render()` function
in `build.mjs`, which reuses `index.html`'s exact CSS) plus **one data file per
market** in `data/<cc>.json`.

## Regenerate all pages

```bash
node build.mjs
```

This writes `/<cc>/index.html` for every `data/<cc>.json` and regenerates
`sitemap.xml`. No dependencies (Node 18+).

## Add a new market

1. Copy `data/de.json` → `data/<cc>.json` (e.g. `fr.json`).
2. Translate the values and update the country-specific facts: `cc`, `lang`,
   `ogLocale`, `canonical`, the geo box, the `keyFacts`, the `fines` order/amounts,
   and the `sources` (link the local statute + EUR-Lex).
3. **Verify every legal figure** against a primary source before committing
   (see `SEO_SUBPAGES_PLAN.md` §8). This site sells compliance evidence — a wrong
   fine is a liability.
4. Run `node build.mjs`.
5. Add the new `hreflang` line to `index.html`'s `<head>` and a link in its footer.

## Add a keyword sub-page

Keyword pages target one high-intent term each (e.g. "BFSG Bußgeld") and use a
leaner, answer-first template (`renderKeyword()` in `build.mjs`).

1. Add `data/keywords/<cc>-<slug>.json` (copy `data/keywords/de-bfsg-bussgeld.json`).
   Key fields: `cc`, `slug`, `canonical`, `hubHref`/`hubLabel`, an `answerHtml`
   (the extractable answer paragraph), `breadcrumb`, `sections`, and a localized `faqSection`.
2. Link it from the country hub (add an internal link in that market's `data/<cc>.json`).
3. Run `node build.mjs` → writes `/<cc>/<slug>/index.html` and adds it to the sitemap.
4. Each page emits `BreadcrumbList` + `FAQPage` JSON-LD automatically.

## Legal / static pages

`/imprint/`, `/privacy/`, `/accessibility-statement/` are generated from
`data/legal/*.json` via `renderLegal()`. Each has a `slug`, `lang`, `canonical`,
`h1`, `updated`, and a single `bodyHtml` field. Placeholder fields awaiting real
data use `<span class='todo'>[…]</span>` (highlighted amber) — fill these before
relying on the Impressum legally.

## Footer (column layout)

The navy column footer is generated once by `footerColumns()` from `data/*.json`:
one column per market (in `MARKET_ORDER`) listing the hub + every keyword
sub-page for that market, plus a Legal column. New market or keyword pages appear
automatically on the next `node build.mjs`. The same footer is injected into
`index.html` between the `<!--FOOTER:START-->` / `<!--FOOTER:END-->` markers, so
the hand-authored root page stays in sync too — **do not remove those markers.**

## Analytics

Every page loads **Plausible** (cookieless, GDPR-friendly, no cookie banner) via the
shared `ANALYTICS` tag in `build.mjs` (`data-domain="keepcite.com"`) and directly in
`index.html`'s `<head>`. The privacy policy discloses it (§2d). Switching to Google
Analytics would require a cookie-consent banner and rewriting the privacy page — do
not swap it out casually.

## Validate submission-readiness

```bash
node build.mjs && node validate.mjs
```

`validate.mjs` discovers every page from `data/` and checks: unique `<title>` < 60,
unique meta description < 160, exactly one `<h1>`, a canonical tag, a self-referencing
hreflang, and parseable JSON-LD. It exits non-zero on any failure.

## Shared CSS lives in index.html

`build.mjs` extracts `index.html`'s `<style>` as `sharedCss` and appends `extraCss`
(keyword/legal-only rules) for generated pages. **CSS for components that appear on
every page — the column footer and the region banner — must live in index.html's
`<style>`, not in `extraCss`.** If you put a global component's CSS only in `extraCss`,
index.html renders it unstyled (this caused the footer links to run together). Keep
shared-component CSS in index.html; keep page-type-specific CSS in `extraCss`.

## Region banner

`BANNER_JS` in `build.mjs` (and an equivalent block in index.html's geo script) shows a
dismissible "suggested region" bar — NOT a redirect — when ipapi.co detects a country
that has a hub and the visitor isn't already in that market. Country → hub/name/market
maps are in that snippet; add new markets there too.

## Notes

- The Web3Forms key is shared; each page adds a hidden `market` field (e.g. `DE`)
  so submissions are routed by country.
- `sitemap.xml` and `robots.txt` are already referenced for crawlers.
- Strategy, keyword matrix and rollout order live in `SEO_SUBPAGES_PLAN.md`.
