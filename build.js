/* Pre-renders one real HTML file per package into /tours/<slug>/index.html,
   plus sitemap.xml. This is what makes the site findable in search —
   a client-rendered page will not rank. Run: node build.js */
const fs = require('fs');
const path = require('path');

const site = JSON.parse(fs.readFileSync('data/site.json', 'utf8'));
const packages = JSON.parse(fs.readFileSync('data/packages.json', 'utf8'));
const cfg = (fs.readFileSync('config.js', 'utf8').match(/SITE_URL:\s*"([^"]*)"/) || [])[1] || '';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

fs.rmSync('tours', { recursive: true, force: true });
fs.mkdirSync('tours', { recursive: true });

const live = packages.filter(p => p.published);

live.forEach(p => {
  const dir = path.join('tours', p.slug);
  fs.mkdirSync(dir, { recursive: true });

  /* JSON-LD so search engines understand this is a tour product */
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: p.title,
    description: p.tagline,
    image: p.hero,
    provider: { '@type': 'TravelAgency', name: site.brand.name, url: cfg },
    itinerary: p.itinerary.map((d, i) => ({
      '@type': 'ListItem', position: i + 1, name: d.title, description: d.text
    }))
  };
  if (!p.onRequest && p.priceFrom) {
    ld.offers = { '@type': 'Offer', price: p.priceFrom, priceCurrency: 'INR', availability: 'https://schema.org/InStock' };
  }

  /* Real content in the HTML, then the interactive version hydrates over it */
  const fallback =
    '<div class="wrap" style="padding-top:150px;padding-bottom:60px">' +
    '<p class="eyebrow">' + esc(p.category) + '</p>' +
    '<h1 class="h-xl mt-s">' + esc(p.title) + '</h1>' +
    '<p class="lede mt-m">' + esc(p.tagline) + '</p>' +
    '<p class="lede mt-m">' + esc(p.overview) + '</p>' +
    '<h2 class="h-lg" style="margin-top:40px">Day by day</h2>' +
    p.itinerary.map(d =>
      '<h3 style="font-size:19px;margin-top:22px">' + esc(d.label) + ' \u2014 ' + esc(d.title) + '</h3>' +
      '<p class="lede">' + esc(d.text) + '</p>').join('') +
    '<h2 class="h-lg" style="margin-top:40px">Included</h2><ul class="tick mt-m">' +
    p.inclusions.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '</div>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} — ${esc(site.brand.name)}</title>
<meta name="description" content="${esc(p.tagline)}">
<link rel="canonical" href="${esc(cfg)}/tours/${esc(p.slug)}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.title)} — ${esc(site.brand.name)}">
<meta property="og:description" content="${esc(p.tagline)}">
<meta property="og:image" content="${esc(p.hero)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body data-page="package" data-solid="false">
<main id="pkg">${fallback}</main>
<script>window.KAFILA_SLUG=${JSON.stringify(p.slug)};</script>
<script src="../../config.js"></script>
<script src="../../assets/js/core.js"></script>
<script src="../../assets/js/booking.js"></script>
<script src="../../assets/js/pages.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
});

/* sitemap */
const urls = ['', 'journeys.html', 'founders.html', 'about.html', 'contact.html']
  .map(u => cfg + '/' + u)
  .concat(live.map(p => cfg + '/tours/' + p.slug + '/'));

fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => '  <url><loc>' + esc(u) + '</loc></url>').join('\n') +
  '\n</urlset>\n');

fs.writeFileSync('robots.txt',
  'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ' + cfg + '/sitemap.xml\n');

console.log('Built ' + live.length + ' tour pages, sitemap and robots.txt');
