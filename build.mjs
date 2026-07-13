// keepcite country-page generator.
// One template (this render function) + one data file per market (data/<cc>.json)
// → /<cc>/index.html, all sharing index.html's exact CSS. Also emits sitemap.xml.
// Run: `node build.mjs`   (Node 18+, no dependencies)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://keepcite.com';

// Privacy-friendly, cookieless analytics (no cookie banner needed under GDPR).
const ANALYTICS = '<script defer data-domain="keepcite.com" src="https://plausible.io/js/script.js"></script>';

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
  /* keyword sub-page */
  .crumb{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--muted);padding:20px 0 0;}
  .crumb a{color:var(--blue);text-decoration:none;}
  .crumb a:hover{text-decoration:underline;}
  .kwhero{padding:14px 0 8px;}
  .kwhero h1{font-size:clamp(30px,4.4vw,48px);max-width:22ch;margin:14px 0 18px;letter-spacing:-.02em;}
  .answerbox{background:#fff;border:1.5px solid #C9D8FB;border-left:4px solid var(--blue);border-radius:14px;padding:22px 24px;font-size:17.5px;font-weight:500;color:#28324A;max-width:72ch;box-shadow:0 22px 50px -32px rgba(20,80,240,.4);}
  .answerbox b{color:var(--ink);}
  .kwbody{padding:8px 0 20px;}
  .kwbody .col{max-width:74ch;}
  .kwsection{margin-top:34px;}
  .kwsection h2{font-size:clamp(21px,2.8vw,28px);font-weight:800;letter-spacing:-.015em;margin-bottom:10px;}
  .kwsection p{color:#3C4452;font-weight:500;margin-bottom:12px;}
  .kwscan{max-width:560px;margin:0 auto;}
  .kwscanband{padding:16px 0 60px;}
  /* NOTE: the column-footer and region-banner CSS live in index.html's <style>
     (the shared stylesheet), so index.html and every generated page get them
     from one source. Do not re-add them here. */
  /* legal pages */
  .legalwrap{padding:34px 0 64px;}
  .legal{max-width:820px;}
  .legal h1{font-size:clamp(30px,4vw,44px);margin-bottom:8px;}
  .legal .updated{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--muted);margin-bottom:26px;}
  .legal h2{font-size:22px;font-weight:800;letter-spacing:-.015em;margin:32px 0 10px;}
  .legal h3{font-size:17px;font-weight:700;margin:20px 0 6px;}
  .legal p,.legal li{color:#28324A;font-weight:500;font-size:16px;margin-bottom:12px;line-height:1.65;}
  .legal ul{margin:0 0 12px 22px;}
  .legal a{color:var(--blue);}
  .legal address{font-style:normal;color:#28324A;font-weight:600;line-height:1.8;margin-bottom:12px;}
  .legal .todo{background:#FFF0C2;color:#7A5B00;padding:1px 7px;border-radius:5px;font-weight:700;font-size:14px;}
`;

// Suggested-region banner (NOT a redirect): if the visitor's country has a hub and
// they aren't already in that market, show a small dismissible bar. Same ipapi.co
// detection as the hero badge; graceful fallback (no banner on failure). Used on
// every generated page and, verbatim, in index.html.
const BANNER_JS = `(function(){
  var host=document.getElementById('regionbar'); if(!host) return;
  try{ if(sessionStorage.getItem('kc_region_x')) return; }catch(e){}
  var HUB={DE:'/de/',FR:'/fr/',ES:'/es/',IT:'/it/',NL:'/nl/',IE:'/ie/',SE:'/se/',AT:'/at/'};
  var NAME={DE:'Deutschland',FR:'France',ES:'España',IT:'Italia',NL:'Nederland',IE:'Ireland',SE:'Sverige',AT:'Österreich'};
  var MKT={DE:'de',FR:'fr',ES:'es',IT:'it',NL:'nl',IE:'ie',SE:'se',AT:'at'};
  var T={en:['Looks like you’re in','See our %C page','Dismiss'],de:['Sie sind offenbar in','Zur Seite für %C','Schließen'],fr:['Vous semblez être en','Voir notre page %C','Fermer'],es:['Parece que estás en','Ver nuestra página de %C','Cerrar'],it:['Sembra che tu sia in','Vai alla pagina %C','Chiudi'],nl:['Je bevindt je vermoedelijk in','Bekijk onze %C-pagina','Sluiten'],sv:['Du verkar vara i','Se vår %C-sida','Stäng']};
  function show(cc){
    if(!cc||!HUB[cc]) return;
    if(MKT[cc]===(host.dataset.market||'')) return;
    var lang=(document.documentElement.lang||'en').slice(0,2);
    var t=T[lang]||T.en, name=NAME[cc];
    document.getElementById('regionbar-text').textContent=t[0]+' '+name+' —';
    var lk=document.getElementById('regionbar-link'); lk.textContent=t[1].replace('%C',name)+' →'; lk.href=HUB[cc];
    var x=document.getElementById('regionbar-x'); x.setAttribute('aria-label',t[2]);
    function dismiss(){ host.hidden=true; try{sessionStorage.setItem('kc_region_x','1');}catch(e){} }
    x.addEventListener('click',dismiss);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!host.hidden) dismiss(); });
    host.hidden=false;
  }
  try{
    fetch('https://ipapi.co/json/',{signal:(typeof AbortSignal!=='undefined'&&AbortSignal.timeout)?AbortSignal.timeout(2500):undefined})
      .then(function(r){return r.json();}).then(function(d){ if(d&&d.country_code) show(d.country_code); }).catch(function(){});
  }catch(e){}
})();`;

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
})();
${BANNER_JS}`;

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const raw = (s = '') => s; // content authored as trusted HTML in our own JSON

function financeSpan(f) {
  const small = f.small ? `<small>${esc(f.small)}</small>` : '';
  // Non-numeric amount (e.g. Sweden's case-by-case "vite" — no fixed statutory max).
  if (f.amountText) {
    return `<div class="amount" style="font-size:clamp(26px,2.8vw,34px);">${esc(f.amountText)}${small}</div>`;
  }
  const pre = f.prefix ?? '', suf = f.suffix ?? '';
  const init = `${pre}0${suf}`;
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

// ---------- shared column footer ----------
const MARKET_ORDER = ['de', 'fr', 'es', 'it', 'nl', 'ie', 'se', 'at'];
let FOOTER_COLS = ''; // assigned in the build step once markets + keywords are loaded

function footerColumns(markets, keywords) {
  const sorted = [...markets].sort((a, b) => {
    const ai = MARKET_ORDER.indexOf(a.cc), bi = MARKET_ORDER.indexOf(b.cc);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  const cols = [`<nav class="footcol" aria-label="EU / English"><h3><a href="/">EU / English</a></h3></nav>`];
  for (const m of sorted) {
    const path = m.canonical.replace(BASE, '');
    const kws = keywords.filter(k => k.cc === m.cc)
      .map(k => `<a href="/${k.cc}/${k.slug}/">${esc(k.breadcrumb[k.breadcrumb.length - 1].name)}</a>`).join('');
    cols.push(`<nav class="footcol" aria-label="${esc(m.switchLabel)}"><h3><a href="${path}">${esc(m.switchLabel)}</a></h3>${kws}</nav>`);
  }
  cols.push(`<div class="footcol"><h3>Legal</h3><a href="/imprint/">Imprint</a><a href="/privacy/">Privacy</a><a href="/accessibility-statement/">Accessibility statement</a><a href="mailto:hello@keepcite.com">hello@keepcite.com</a></div>`);
  return `<div class="footcols">\n      ${cols.join('\n      ')}\n    </div>`;
}

function renderFooter(noteHtml, sourcesLabel, sources) {
  const src = sources && sources.length
    ? `\n    <p class="sources">${sourcesLabel} ${sources.map(s => `<a href="${s.href}" rel="nofollow">${esc(s.label)}</a>`).join(' · ')}</p>` : '';
  return `<footer>
  <div class="wrap">
    ${FOOTER_COLS}
    <div class="foot-row">
      <a class="logo" href="/">keep<em>cite</em></a>
      <p><a href="mailto:hello@keepcite.com">hello@keepcite.com</a> · Chirimoya OÜ · Tallinn, EU</p>
    </div>
    <p class="foot-note">${raw(noteHtml)}</p>${src}
  </div>
</footer>`;
}

// ---------- legal / static content pages ----------
function renderLegal(page) {
  return `<!DOCTYPE html>
<html lang="${page.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.metaDescription)}">
<link rel="canonical" href="${page.canonical}">
<link rel="alternate" hreflang="${page.lang}" href="${page.canonical}">
<meta name="robots" content="${page.robots || 'index,follow'}">
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: page.h1, url: page.canonical, inLanguage: page.lang, isPartOf: { '@type': 'WebSite', name: 'keepcite', url: `${BASE}/` } }, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${sharedCss}${extraCss}</style>
${ANALYTICS}
</head>
<body>
<a class="skip" href="#main">${esc(page.skip || 'Skip to main content')}</a>

<header>
  <div class="wrap nav">
    <a class="logo" href="/">keep<em>cite</em></a>
    <nav aria-label="Main">
      <ul class="nav-links">
        <li><a href="/">keepcite.com</a></li>
        <li><a class="btn" href="/#scan" style="padding:11px 20px;font-size:14.5px;">${esc(page.cta || 'Free scan')}</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">
  <div class="regionbar" id="regionbar" data-market="" hidden>
    <div class="wrap">
      <span id="regionbar-text"></span>
      <a id="regionbar-link" href="#"></a>
      <button type="button" id="regionbar-x" aria-label="Dismiss">&#10005;</button>
    </div>
  </div>
  <section class="legalwrap">
    <div class="wrap">
      <div class="legal reveal">
        <h1 class="display">${esc(page.h1)}</h1>
        <p class="updated">${esc(page.updated)}</p>
        ${page.bodyHtml}
      </div>
    </div>
  </section>
</main>

${renderFooter(page.footNote, null, null)}

<script>${script('.')}
</script>
</body>
</html>
`;
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
${ANALYTICS}
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

<div class="regionbar" id="regionbar" data-market="${d.cc}" hidden>
  <div class="wrap">
    <span id="regionbar-text"></span>
    <a id="regionbar-link" href="#"></a>
    <button type="button" id="regionbar-x" aria-label="Dismiss">&#10005;</button>
  </div>
</div>

<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div>
      <h1 class="display">${raw(d.h1Html)}</h1>
      <p class="sub">${raw(d.heroSubHtml)}</p>
    </div>

    <div class="scanform" id="scan">
      <p class="scanlead">${raw(d.scan.leadHtml)} <span class="free">${esc(d.scan.free)}</span></p>
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

${renderFooter(d.footer.noteHtml, d.footer.sourcesLabel, d.footer.sources)}

<script>${script(sep)}
</script>
</body>
</html>
`;
}

// ---------- keyword sub-page template ----------
function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.item })),
  };
}

function renderKeyword(kw, sep) {
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: kw.schema.inLanguage,
    mainEntity: kw.faqSection.items.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a.replace(/<[^>]+>/g, '') } })),
  };
  return `<!DOCTYPE html>
<html lang="${kw.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(kw.title)}</title>
<meta name="description" content="${esc(kw.metaDescription)}">
<link rel="canonical" href="${kw.canonical}">
<link rel="alternate" hreflang="${kw.hreflang || kw.lang}" href="${kw.canonical}">
<meta property="og:title" content="${esc(kw.ogTitle)}">
<meta property="og:description" content="${esc(kw.ogDescription)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${kw.ogLocale}">
<meta property="og:url" content="${kw.canonical}">
<script type="application/ld+json">
${JSON.stringify(breadcrumbSchema(kw.breadcrumb), null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(faq, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${sharedCss}${extraCss}</style>
${ANALYTICS}
</head>
<body>
<a class="skip" href="#scan">${esc(kw.skip)}</a>

<header>
  <div class="wrap nav">
    <a class="logo" href="${kw.hubHref}">keep<em>cite</em></a>
    <nav aria-label="${esc(kw.nav.ariaLabel)}">
      <ul class="nav-links">
        <li><a href="${kw.hubHref}">${esc(kw.hubLabel)}</a></li>
        <li><a href="${kw.hubHref}#pricing">${esc(kw.nav.pricing)}</a></li>
        <li><a href="#faq">${esc(kw.nav.faq)}</a></li>
        <li><a class="btn" href="#scan" style="padding:11px 20px;font-size:14.5px;">${esc(kw.nav.cta)}</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">
  <div class="regionbar" id="regionbar" data-market="${kw.cc}" hidden>
    <div class="wrap">
      <span id="regionbar-text"></span>
      <a id="regionbar-link" href="#"></a>
      <button type="button" id="regionbar-x" aria-label="Dismiss">&#10005;</button>
    </div>
  </div>
  <div class="wrap"><nav class="crumb" aria-label="Breadcrumb">${kw.breadcrumb.map((b, i) => i < kw.breadcrumb.length - 1 ? `<a href="${b.href}">${esc(b.name)}</a> / ` : `<span>${esc(b.name)}</span>`).join('')}</nav></div>

  <section class="kwhero">
    <div class="wrap">
      <span class="kicker"><span class="pulse" aria-hidden="true"></span>${esc(kw.kicker)}</span>
      <h1 class="display">${raw(kw.h1Html)}</h1>
      <div class="answerbox reveal">${raw(kw.answerHtml)}</div>
    </div>
  </section>

  <section class="keyfactsband">
    <div class="wrap">
      <div class="keyfacts reveal">
        <h2>${esc(kw.keyFacts.title)}</h2>
        <dl>
          ${kw.keyFacts.items.map(i => `<dt>${esc(i.label)}</dt><dd>${raw(i.value)}</dd>`).join('\n          ')}
        </dl>
      </div>
    </div>
  </section>

  <section class="kwbody">
    <div class="wrap">
      <div class="col">
        ${kw.sections.map(s => `<div class="kwsection reveal">
          <h2>${esc(s.h2)}</h2>
          ${s.bodyHtml}
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="kwscanband" id="scan">
    <div class="wrap">
      <div class="scanform kwscan">
        <div class="head">
          <h2>${esc(kw.scan.h2)}</h2>
          <span class="free">${esc(kw.scan.free)}</span>
        </div>
        <p class="sub2">${esc(kw.scan.sub2)}</p>
        <form action="https://api.web3forms.com/submit" method="POST" aria-label="${esc(kw.scan.formAria)}">
          <input type="hidden" name="access_key" value="c5401409-96ce-4c81-b144-bba532372fdd">
          <input type="hidden" name="subject" value="${esc(kw.scan.subject)}">
          <input type="hidden" name="market" value="${kw.cc.toUpperCase()}">
          <input type="hidden" name="page" value="${kw.slug}">
          <input type="checkbox" name="botcheck" style="display:none;" tabindex="-1" aria-hidden="true">
          <div class="row">
            <div>
              <label for="url">${esc(kw.scan.urlLabel)}</label>
              <input id="url" name="store_url" type="url" placeholder="${esc(kw.scan.urlPh)}" required autocomplete="url">
            </div>
            <div>
              <label for="email">${esc(kw.scan.emailLabel)}</label>
              <input id="email" name="email" type="email" placeholder="${esc(kw.scan.emailPh)}" required autocomplete="email">
            </div>
            <button class="btn btn-lg" type="submit">${esc(kw.scan.button)}</button>
          </div>
          <p class="note">${esc(kw.scan.note)}</p>
        </form>
      </div>
    </div>
  </section>

  <section class="faqsec" id="faq">
    <div class="wrap">
      <h2 class="display reveal">${esc(kw.faqSection.h2)}</h2>
      <div class="faq reveal">
        ${kw.faqSection.items.map(i => `<details>
          <summary>${esc(i.q)}</summary>
          <p>${raw(i.a)}</p>
        </details>`).join('\n        ')}
      </div>
    </div>
  </section>
</main>

${renderFooter(kw.footer.noteHtml, kw.footer.sourcesLabel, kw.footer.sources)}

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

// keyword sub-pages: data/keywords/<cc>-<slug>.json → /<cc>/<slug>/index.html
const kwDir = join(dataDir, 'keywords');
const keywords = existsSync(kwDir)
  ? readdirSync(kwDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(kwDir, f), 'utf8')))
  : [];

// legal / static pages: data/legal/<slug>.json → /<slug>/index.html
const legalDir = join(dataDir, 'legal');
const legals = existsSync(legalDir)
  ? readdirSync(legalDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(legalDir, f), 'utf8')))
  : [];

// build the shared column footer now that markets + keywords are known
FOOTER_COLS = footerColumns(markets, keywords);

const built = [];
for (const m of markets) {
  const html = render(m, alternatesFor(), m.thousandsSep || '.');
  const dir = join(ROOT, m.cc);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  built.push(`/${m.cc}/`);
  console.log(`built /${m.cc}/index.html`);
}
for (const kw of keywords) {
  const html = renderKeyword(kw, kw.thousandsSep || '.');
  const dir = join(ROOT, kw.cc, kw.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  built.push(`/${kw.cc}/${kw.slug}/`);
  console.log(`built /${kw.cc}/${kw.slug}/index.html`);
}
for (const pg of legals) {
  const html = renderLegal(pg);
  const dir = join(ROOT, pg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  built.push(`/${pg.slug}/`);
  console.log(`built /${pg.slug}/index.html`);
}

// keep index.html's footer in sync (between the FOOTER markers)
const idxPath = join(ROOT, 'index.html');
const idx = readFileSync(idxPath, 'utf8');
const idxFooter = `<!--FOOTER:START-->\n    ${FOOTER_COLS}\n    <div class="foot-row">\n      <a class="logo" href="/">keep<em>cite</em></a>\n      <p><a href="mailto:hello@keepcite.com">hello@keepcite.com</a> · Chirimoya OÜ · Tallinn, EU</p>\n    </div>\n    <p class="foot-note">This page passes the audit it sells: WCAG 2.1 AA, keyboard-navigable, screen-reader tested. · © 2026 keepcite</p>\n    <!--FOOTER:END-->`;
const markerRe = /<!--FOOTER:START-->[\s\S]*?<!--FOOTER:END-->/;
if (!markerRe.test(idx)) { console.log('WARNING: index.html footer markers not found — footer not patched'); }
else {
  const idxPatched = idx.replace(markerRe, idxFooter);
  if (idxPatched !== idx) { writeFileSync(idxPath, idxPatched); console.log('patched index.html footer'); }
  else { console.log('index.html footer already current'); }
}

// sitemap.xml (root + markets + keyword pages + legal pages) with <lastmod>
const entries = [
  { loc: `${BASE}/`, file: 'index.html' },
  ...markets.map(m => ({ loc: m.canonical, file: `${m.cc}/index.html` })),
  ...keywords.map(k => ({ loc: k.canonical, file: `${k.cc}/${k.slug}/index.html` })),
  ...legals.map(l => ({ loc: l.canonical, file: `${l.slug}/index.html` })),
];
const lastmod = f => statSync(join(ROOT, f)).mtime.toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${e.loc}</loc><lastmod>${lastmod(e.file)}</lastmod></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
console.log(`wrote sitemap.xml (${entries.length} urls)`);
