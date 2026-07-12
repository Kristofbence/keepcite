# keepcite — Country × Keyword Subpage Plan (SEO + LLM/AEO)

Goal: a scalable set of **country-specific landing pages, in each country's own
language, built from the same template as `index.html`**, that (a) rank for local
EAA/accessibility keywords and (b) are cited by LLMs / answer engines (ChatGPT,
Google AI Overviews, Perplexity). Each page targets one country and one keyword
cluster and drives the same conversion goal: the free checkout scan.

Domain: **keepcite.com** (GitHub Pages, `CNAME` already set → static hosting, ideal
for this approach).

---

## 1. The core insight: sell the *local law name*

Nobody in Germany searches "European Accessibility Act." They search **BFSG**.
The single highest-leverage SEO + AEO move is to anchor every country page on the
**local statute name and its enforcement facts**. That gives us:

- The exact keyword real buyers type (local intent, low competition).
- A unique entity per page → not duplicate content, and a concrete reason for an
  LLM to cite *this* page when asked about *that* country's law.

| Market | Lang | Local law / entity to own (keyword gold) | Fine hook | Priority |
|--------|------|------------------------------------------|-----------|----------|
| Germany | `de` | **Barrierefreiheitsstärkungsgesetz (BFSG)** | up to €100,000 | **P1** |
| France | `fr` | **RGAA** / obligation d'accessibilité numérique | court order €500/day | **P1** |
| Spain | `es` | **Real Decreto 193/2023** / ley de accesibilidad | up to €1,000,000 | **P1** |
| Italy | `it` | **Legge Stanca** + European Accessibility Act | up to €40,000 / 5% turnover | P2 |
| Netherlands | `nl` | Toegankelijkheid / EAA | up to €900,000 / 10% turnover | P2 |
| Ireland | `en` | EAA (only EU state with **criminal** liability) | €60,000 + up to 18 months | P2 |
| Austria | `de` | **Barrierefreiheitsgesetz (BaFG)** | up to €80,000 | P3 |
| Belgium | `nl`/`fr` | EAA | national regime | P3 |
| Sweden | `sv` | Tillgänglighetsdirektivet (DOS-lag) | first e-commerce cases opened | P3 |
| Poland | `pl` | Ustawa o dostępności | national regime | P3 |

> **Validate before publishing.** All fine figures, law citations and enforcement
> bodies must be re-verified per market (see §8 Governance). The Ahrefs/Semrush
> MCP keyword tools were not accessible on the current plan tier, so search
> volumes still need a data pull; the *keyword targets* below stand on entity/
> intent logic regardless.

---

## 2. URL architecture

Decision: **language subfolders on the one domain** (not ccTLDs, not subdomains).
Concentrates authority on keepcite.com, trivial on GitHub Pages, clean hreflang.

```
/                         → English, EU-wide (current index.html)
/de/                      → German hub (BFSG)
/de/bfsg-bussgeld/        → keyword page: "BFSG Bußgeld"
/de/barrierefreiheit-online-shop/
/de/wcag-2-1-aa-checkliste/
/fr/                      → French hub (RGAA)
/fr/sanctions-accessibilite/
/es/ ...                  etc.
```

Per page: **self-referencing canonical** + a full **hreflang cluster** listing every
language variant and `x-default → /`.

---

## 3. Page archetypes (same template, 4 intents)

Every market reuses the same 4 slots; only data/copy changes:

1. **Hub / law explainer** — `/{cc}/` — informational + AEO anchor. Owns
   "{local law} for online shops".
2. **Fines / enforcement** — `/{cc}/{law}-bussgeld|sanctions|multas/` — highest
   urgency + intent. Owns "{local law} fine / sanction".
3. **How-to / compliance** — `/{cc}/barrierefreiheit-online-shop/` etc. — commercial.
4. **Standard / checklist** — `/{cc}/wcag-2-1-aa-checkliste/` — informational link magnet.
   *(Optional P2: platform pages — "Shopify / Shopware / WooCommerce Barrierefreiheit" —
   high commercial intent, low competition.)*

### Seed keyword clusters (Germany, illustrative)
`bfsg` · `bfsg online shop` · `barrierefreiheitsstärkungsgesetz` ·
`barrierefreiheit online shop` · `barrierefreie website` · `wcag 2.1 aa` ·
`bfsg bußgeld` · `barrierefreiheitserklärung` · `barrierefreiheit shopify` ·
`barrierefreiheit shopware`. (Replicate the pattern per market with the local law name.)

---

## 4. Template anatomy — data-driven, one template

Reuse the exact sections of `index.html`; each becomes a slot filled from a per-page
data object (`{{MUSTACHE}}` fields), so all pages stay visually identical and
maintainable from one file:

| Section | Localized per page |
|---------|--------------------|
| `<html lang>` | `de`, `fr`, … |
| `<head>` | title, meta description, canonical, **hreflang set**, OG tags, `lang` |
| JSON-LD ×2 | `ProfessionalService` + `FAQPage`, **translated**, `areaServed` = country |
| Hero | localized H1 (question form), sub, **geo box hardcoded to this country + its fine** |
| Scan form | same Web3Forms key + hidden field `market: DE` for routing |
| "Law in 30s" | names the **local statute** + Directive (EU) 2019/882 + EN 301 549 / WCAG 2.1 AA |
| Fines grid | reordered to lead with **this country's** fine + local enforcement facts |
| How it works / Pricing | shared, translated |
| FAQ | **localized Q&A** — also feeds `FAQPage` schema (the AEO engine) |
| Footer | localized; per-market imprint where required |

Build: one template + per-page JSON + a ~30-line renderer (or Eleventy/Astro) →
flat `/{cc}/{slug}/index.html`. Fully static, no backend.

---

## 5. LLM-searchability (AEO) — the "citable by AI" requirement

- **Answer-first structure**: every H2/H3 is a real question; the first sentence
  answers it in ≤ ~300 chars so it's extractable as a snippet / AI answer.
- **Schema on every page**: `FAQPage` + `ProfessionalService`, localized. (Already
  the pattern in `index.html`.)
- **Entity clarity**: state the statute name, the Directive (EU) 2019/882, the
  standard (EN 301 549 → WCAG 2.1 AA), the enforcement body, and the dates/figures
  in plain language. LLMs cite pages that assert entities + numbers + dates cleanly.
- **Primary-source links**: link EUR-Lex, the national gazette (e.g.
  gesetze-im-internet.de for BFSG), and named court cases. Raises trust + citation odds.
- **A TL;DR "key facts" block** near the top: machine-extractable summary of law,
  who it covers, deadline, max fine.
- **Unique facts per country** (local case, local regulator, local fine) → gives an
  LLM a specific reason to cite this page for that jurisdiction.
- Content readable **without JS** (already true) and fast (static).

---

## 6. Duplicate-content control

- ≥ ~40–50% of each page is unique localized content (law name, fines, cases,
  regulator, FAQ). Shared chrome (pricing / how-it-works) is fine.
- Distinct title / meta / H1 per page, self canonical, hreflang to disambiguate
  language variants.

---

## 7. Technical checklist

- `sitemap.xml` listing all pages with `hreflang` alternates; `robots.txt` allowing
  all + sitemap reference.
- Internal linking: root ↔ hubs ↔ keyword pages, plus a visible "other countries"
  switcher mirroring the hreflang set.
- Reuse existing performance/a11y baseline (the page already passes WCAG 2.1 AA —
  itself an E-E-A-T signal worth stating on each page).

---

## 8. Governance — CRITICAL (legal accuracy)

This site sells **legal-compliance evidence**; a wrong fine or statute is a
liability. Before any market goes live:

1. Verify max fine, enforcement body, exact law name/citation, and any cited case
   via primary sources / the Legal Data Hunter MCP.
2. Professional/native review of the translated legal copy.
3. Keep a dated source list per page (doubles as E-E-A-T + AEO trust signal).

---

## 9. Rollout

- **P1 (wk 1–2):** DE, FR, ES — hub + fines page each (biggest markets, steepest hooks).
- **P2:** IT, NL, IE + DE platform pages (Shopify/Shopware/WooCommerce).
- **P3:** AT, BE, SE, PL.
- Ship the hub first, watch Google Search Console per `/​{cc}/` folder, then expand
  keyword pages where impressions appear.

**Measurement:** GSC per market folder; rank tracking on seed keywords; monitor AI
Overview / ChatGPT citations once SEO-tool access is restored.

---

## 10. Worked example — `/de/` (German hub)

- **URL:** `/de/`, `<html lang="de">`
- **Title:** `Barrierefreiheitsstärkungsgesetz (BFSG) für Online-Shops – ist Ihr Shop konform? | keepcite`
- **Meta:** `Das BFSG gilt seit 28. Juni 2025 für Online-Shops. keepcite prüft Ihren Checkout gegen WCAG 2.1 AA und liefert einen datierten Nachweis. Kostenloser Scan in 48 Stunden.`
- **H1:** `Verstößt Ihr Checkout gegen das BFSG?`
- **Geo box (hardcoded DE):** `Verkaufen Sie in Deutschland? Bußgelder bis 100.000 € — und Wettbewerber verschicken bereits Abmahnungen.`
- **TL;DR facts:** law = BFSG (umsetzt Directive (EU) 2019/882); gilt seit 28.06.2025;
  Standard = EN 301 549 / WCAG 2.1 AA; Bußgeld bis 100.000 €; Ausnahme nur
  Kleinstunternehmen (< 10 MA **und** < 2 Mio € Umsatz).
- **FAQ (German, 5×)** → feeds German `FAQPage` schema.
- **Outbound trust links:** gesetze-im-internet.de/bfsg, EUR-Lex 32019L0882.
- **Sibling keyword page:** `/de/bfsg-bussgeld/` targeting "BFSG Bußgeld".

This one page doubles as the reference to derive the reusable template; the same
data object shape then generates every other market.
