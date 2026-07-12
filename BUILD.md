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

## Notes

- The Web3Forms key is shared; each page adds a hidden `market` field (e.g. `DE`)
  so submissions are routed by country.
- `sitemap.xml` and `robots.txt` are already referenced for crawlers.
- Strategy, keyword matrix and rollout order live in `SEO_SUBPAGES_PLAN.md`.
