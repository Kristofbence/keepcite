// keepcite country-page generator.
// One template (this render function) + one data file per market (data/<cc>.json)
// → /<cc>/index.html, all sharing index.html's exact CSS. Also emits sitemap.xml.
// Run: `node build.mjs`   (Node 18+, no dependencies)

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://keepcite.com';

// ---- shared chrome pulled straight from index.html so pages stay identical ----
const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
const sharedCss = (index.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

const extraCss = `
  /* country-page additions */
  .keyfactsband{padding:34px 0 0;}
  .keyfacts{background:var(--blue-tint);border:1.5px solid #C9D8FB;border-radius:16px;padding:22px 24px;}
  .keyfacts h2{font-size:13px;font-family:'IBM Plex Mono',monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);margin-bottom:14px;}
  .keyfacts dl{display:grid;grid-template-columns:auto 1fr;gap:9px 20px;margin:0;}
  .keyfacts dt{font-weight:700;color:var(--ink);font-size:14.5px;}
  .keyfacts dd{margin:0;color:#28324A;font-weight:500;font-size:14.5px;}
  .sources{margin-top:22px;font-size:12.5px;color:#7E92BE;font-family:'IBM Plex Mono',monospace;line-height:1.7;}
  .sources a{color:#fff;}
  .countryswitch{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-size:13.5px;}
  .countryswitch a{color:#fff;}
`;

// reveal + count-up only (no geo fetch — country pages hardcode their country)
const script = (sep) => `
(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.15});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  function fmt(n){ return n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ${JSON.stringify(sep)}); }
  function countUp(el){
    var to = parseInt(el.dataset.to,10), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if(reduced){ el.textContent = pre + fmt(to) + suf; return; }
    var dur = 1400, start = null;
    function step(ts){ if(!start) start = ts; var p = Math.min((ts-start)/dur,1);
      var eased = 1 - Math.pow(1-p,3); el.textContent = pre + fmt(Math.round(to*eased)) + suf;
      if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); cio.unobserve(e.target); } });
  },{threshold:.5});
  document.querySelectorAll('.count').forEach(function(el){ cio.observe(el); });
})();`;

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const raw = (s = '') => s; // content authored as trusted HTML in our own JSON

function financeSpan(f) {
  const pre = f.prefix ?? '', suf = f.suffix ?? '';
  const init = `${pre}0${suf}`;
  const small = f.small ? `<small>${esc(f.small)}</small>` : '';
  return `<div class="amount"><span class="count" data-to="${f.to}" data-prefix="${esc(pre)}" data-suffix="${esc(suf)}">${esc(init)}</span>${small}</div>`;
}

function fineCard(f) {
  const tag = f.tagline ? `<span class="tagline">${esc(f.tagline)}</span>` : '';
  return `      <div class="fine reveal">
        ${f.flagSvg}
        ${tag}${tag ? '\n        ' : ''}${financeSpan(f)}
        <p class="what">${raw(f.what)}</p>
      </div>`;
}

function faqSchema(items, langName) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: langName,
    mainEntity: items.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.aPlain || i.a.replace(/<[^>]+>/g, '') } })),
  };
}

// ---------- the template ----------
function render(d, alternates, sep) {
  const hreflang = alternates.map(a => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n');
  const serviceSchema = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: d.schema.serviceName,
    description: d.schema.serviceDesc, areaServed: d.schema.areaServed, url: d.canonical, email: d.schema.email,
  };
  return `<!DOCTYPE html>
<html lang="${d.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.title)}</title>
<meta name="description" content="${esc(d.metaDescription)}">
<link rel="canonical" href="${d.canonical}">
${hreflang}
<meta property="og:title" content="${esc(d.ogTitle)}">
<meta property="og:description" content="${esc(d.ogDescription)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${d.ogLocale}">
<meta property="og:url" content="${d.canonical}">
<script type="application/ld+json">
${JSON.stringify(serviceSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(faqSchema(d.faqSection.items, d.schema.inLanguage), null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${sharedCss}${extraCss}</style>
</head>
<body>
<a class="skip" href="#main">${esc(d.skip)}</a>

<header>
  <div class="wrap nav">
    <a class="logo" href="#top">keep<em>cite</em></a>
    <nav aria-label="${esc(d.nav.ariaLabel)}">
      <ul class="nav-links">
        <li><a href="#fines">${esc(d.nav.whyNow)}</a></li>
        <li><a href="#how">${esc(d.nav.how)}</a></li>
        <li><a href="#pricing">${esc(d.nav.pricing)}</a></li>
        <li><a href="#faq">${esc(d.nav.faq)}</a></li>
        <li><a class="btn" href="#scan" style="padding:11px 20px;font-size:14.5px;">${esc(d.nav.cta)}</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">

<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div>
      <span class="kicker"><span class="pulse" aria-hidden="true"></span>${esc(d.kicker)}</span>
      <a class="geo" id="geo" href="#scan" style="display:flex;margin:18px 0 4px;">
        ${d.geoFlagSvg}
        <span id="geo-text">${raw(d.geoText)}</span>
        <span class="geo-cta" aria-hidden="true">&rarr;</span>
      </a>
      <h1 class="display">${raw(d.h1Html)}</h1>
      <p class="sub">${raw(d.heroSubHtml)}</p>
    </div>

    <div class="scanform" id="scan">
      <div class="head">
        <h2>${esc(d.scan.h2)}</h2>
        <span class="free">${esc(d.scan.free)}</span>
      </div>
      <p class="sub2">${esc(d.scan.sub2)}</p>
      <form action="https://api.web3forms.com/submit" method="POST" aria-label="${esc(d.scan.formAria)}">
        <input type="hidden" name="access_key" value="c5401409-96ce-4c81-b144-bba532372fdd">
        <input type="hidden" name="subject" value="${esc(d.scan.subject)}">
        <input type="hidden" name="market" value="${d.cc.toUpperCase()}">
        <input type="checkbox" name="botcheck" style="display:none;" tabindex="-1" aria-hidden="true">
        <div class="row">
          <div>
            <label for="url">${esc(d.scan.urlLabel)}</label>
            <input id="url" name="store_url" type="url" placeholder="${esc(d.scan.urlPh)}" required autocomplete="url">
          </div>
          <div>
            <label for="email">${esc(d.scan.emailLabel)}</label>
            <input id="email" name="email" type="email" placeholder="${esc(d.scan.emailPh)}" required autocomplete="email">
          </div>
          <button class="btn btn-lg" type="submit">${esc(d.scan.button)}</button>
        </div>
        <p class="note">${esc(d.scan.note)}</p>
      </form>
      <div class="trust">
        ${d.trust.map(t => `<span>${raw(t)}</span>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>

<section class="keyfactsband">
  <div class="wrap">
    <div class="keyfacts reveal">
      <h2>${esc(d.keyFacts.title)}</h2>
      <dl>
        ${d.keyFacts.items.map(i => `<dt>${esc(i.label)}</dt><dd>${raw(i.value)}</dd>`).join('\n        ')}
      </dl>
    </div>
  </div>
</section>

<section class="law" id="law">
  <div class="wrap">
    <div class="lawtitle reveal">
      <h2 class="display">${raw(d.law.titleHtml)}</h2>
      <span class="pill">${esc(d.law.pill)}</span>
    </div>
    <div class="lawbox reveal">
      ${d.law.cells.map(c => `<div class="cell">
        <h3>${raw(c.h3Html)}</h3>
        <p>${raw(c.bodyHtml)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="fines" id="fines">
  <div class="wrap">
    <h2 class="display reveal">${raw(d.fines.h2Html)}</h2>
    <p class="lead reveal">${esc(d.fines.lead)}</p>
    <div class="fine-grid">
${d.fines.items.map(fineCard).join('\n')}
    </div>
  </div>
</section>

<section class="value" id="how">
  <div class="wrap">
    <span class="kicker">${esc(d.value.kicker)}</span>
    <h2 class="display reveal" style="margin-top:18px;">${esc(d.value.h2)}</h2>
    <p class="lead reveal">${esc(d.value.lead)}</p>
    <div class="steps">
      ${d.value.steps.map(s => `<div class="step ${s.ofClass} reveal">
        <span class="tagchip">${esc(s.tagchip)}</span>
        <div class="n">${esc(s.n)}</div>
        <h3>${raw(s.h3Html)}</h3>
        <p>${raw(s.p)}</p>
        <span class="pricechip ${s.chipClass}">${esc(s.chipText)}</span>
      </div>`).join('\n      ')}
    </div>
    <div class="proof reveal" style="margin-top:44px;">
      ${d.value.proof.map(p => `<div><b>${esc(p.b)}</b><span>${esc(p.span)}</span></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="midcta">
  <div class="wrap">
    <h2 class="display reveal">${esc(d.midcta.h2)}</h2>
    <a class="btn btn-lg" href="#scan">${esc(d.midcta.button)}</a>
    <p>${esc(d.midcta.note)}</p>
  </div>
</section>

<section class="pricing" id="pricing">
  <div class="wrap">
    <span class="kicker">${esc(d.pricing.kicker)}</span>
    <h2 class="display reveal" style="margin-top:18px;">${esc(d.pricing.h2)}</h2>
    <p class="lead reveal">${esc(d.pricing.lead)}</p>
    <div class="plans">
      ${d.pricing.plans.map(p => `<div class="plan ${p.cls} reveal">
        <span class="tier">${esc(p.tier)}</span>
        <div class="price">${raw(p.priceHtml)}</div>
        <p class="for">${esc(p.forText)}</p>
        <ul>
          ${p.items.map(li => `<li>${raw(li)}</li>`).join('\n          ')}
        </ul>
        <a class="btn${p.btnAlt ? ' alt' : ''}" href="#scan">${esc(p.btnText)}</a>
      </div>`).join('\n      ')}
    </div>
    <p class="plan-note reveal">${raw(d.pricing.noteHtml)}</p>
  </div>
</section>

<section class="faqsec" id="faq">
  <div class="wrap">
    <h2 class="display reveal">${esc(d.faqSection.h2)}</h2>
    <div class="faq reveal">
      ${d.faqSection.items.map(i => `<details>
        <summary>${esc(i.q)}</summary>
        <p>${raw(i.a)}</p>
      </details>`).join('\n      ')}
    </div>
  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <div class="foot-row">
      <a class="logo" href="#top">keep<em>cite</em></a>
      <p>${raw(d.footer.contactHtml)}</p>
    </div>
    <div class="countryswitch">${d._siblings.map(c => `<a href="${c.href}"${c.lang ? ` hreflang="${c.lang}"` : ''}>${esc(c.label)}</a>`).join('')}</div>
    <p class="foot-note">${raw(d.footer.noteHtml)}</p>
    <p class="sources">${d.footer.sourcesLabel} ${d.footer.sources.map(s => `<a href="${s.href}" rel="nofollow">${esc(s.label)}</a>`).join(' · ')}</p>
  </div>
</footer>

<script>${script(sep)}
</script>
</body>
</html>
`;
}

// ---------- build ----------
const dataDir = join(ROOT, 'data');
const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
const markets = files.map(f => JSON.parse(readFileSync(join(dataDir, f), 'utf8')));

// hreflang alternates: every market + the English root as en/x-default
function alternatesFor() {
  const alts = [{ lang: 'x-default', href: `${BASE}/` }, { lang: 'en', href: `${BASE}/` }];
  for (const m of markets) alts.push({ lang: m.hreflang || m.lang, href: m.canonical });
  return alts;
}

// each page's footer links back to the EU/English root + every sibling market
function siblingsFor(cc) {
  const list = [{ label: 'EU / English', href: '/', lang: 'en' }];
  for (const m of markets) if (m.cc !== cc) list.push({ label: m.switchLabel || m.cc.toUpperCase(), href: `/${m.cc}/`, lang: m.lang });
  return list;
}

const built = [];
for (const m of markets) {
  m._siblings = siblingsFor(m.cc);
  const html = render(m, alternatesFor(), m.thousandsSep || '.');
  const dir = join(ROOT, m.cc);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  built.push(`/${m.cc}/`);
  console.log(`built /${m.cc}/index.html`);
}

// sitemap.xml (root + every market)
const urls = [`${BASE}/`, ...markets.map(m => m.canonical)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
console.log(`wrote sitemap.xml (${urls.length} urls)`);
