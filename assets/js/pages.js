/* Page controllers. One function per page, chosen by data-page on <body>. */
(function () {
  'use strict';

  var PAGES = {

    /* ---------------- HOME ---------------- */
    home: function (site, packages, trips) {
      var h = site.hero;
      var hero = document.getElementById('hero');
      hero.innerHTML =
        h.slides.map(function (s, i) {
          return '<div class="frame' + (i ? '' : ' on') + '"><img src="' + K.esc(s.image) + '" alt="' + K.esc(s.label) + '"></div>';
        }).join('') +
        '<div class="wrap">' +
          '<p class="eyebrow" style="color:var(--gold-lt)">Kafila \u00b7 a caravan, a company of travellers</p>' +
          '<h1>' + K.esc(h.headlineTop) + ' <em>' + K.esc(h.headlineEm) + '</em> ' + K.esc(h.headlineEnd) + '</h1>' +
          '<p class="sub">' + K.esc(h.sub) + '</p>' +
          '<div class="acts"><a href="contact.html" class="btn btn--solid">Reserve your journey <span class="arw">\u2192</span></a>' +
          '<a href="journeys.html" class="btn btn--light">See where we go</a></div>' +
          '<div class="route" id="route">' +
            h.slides.map(function (s, i) {
              return (i ? '<span class="seg"></span>' : '') +
                '<button class="stop' + (i ? '' : ' on') + '" data-i="' + i + '" aria-label="' + K.esc(s.label) + '">' +
                '<span class="dot"></span><span class="lbl">' + K.esc(s.label) + '</span></button>';
            }).join('') +
          '</div>' +
        '</div>';

      var frames = hero.querySelectorAll('.frame'),
          stops = hero.querySelectorAll('.stop'),
          segs = hero.querySelectorAll('.seg'), i = 0, t;
      function go(n) {
        i = n;
        frames.forEach(function (f, x) { f.classList.toggle('on', x === n); });
        stops.forEach(function (s, x) { s.classList.toggle('on', x === n); });
        segs.forEach(function (s, x) { s.classList.toggle('done', x < n); });
      }
      function loop() { clearInterval(t); t = setInterval(function () { go((i + 1) % frames.length); }, 6500); }
      stops.forEach(function (s) { s.addEventListener('click', function () { go(+s.dataset.i); loop(); }); });
      loop();

      /* why */
      var w = site.why;
      document.getElementById('why').innerHTML =
        '<div class="wrap"><div class="ledger reveal">' +
          '<div><p class="eyebrow">Why Kafila</p><h2 class="h-xl mt-s">' + w.heading + '</h2></div>' +
          '<div><p class="lede" style="font-size:18px">' + K.esc(w.lede) + '</p><div class="pillars">' +
            w.pillars.map(function (p, n) {
              return '<div class="pillar"><span class="n">0' + (n + 1) + '</span><h3>' + K.esc(p.title) + '</h3><p>' + K.esc(p.text) + '</p></div>';
            }).join('') +
          '</div></div></div></div>';

      /* featured */
      var feat = packages.filter(function (p) { return p.featured && p.published; }).slice(0, 4);
      if (feat.length < 4) feat = packages.filter(function (p) { return p.published; }).slice(0, 4);
      var shapes = ['tall', 'wide', '', ''];
      document.getElementById('featured').innerHTML =
        '<div class="wrap">' +
        '<div class="caravan" style="margin-bottom:clamp(48px,7vw,86px)"><b></b><i></i><b class="on"></b><i></i><b></b><i></i><b></b></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between;align-items:end;margin-bottom:clamp(30px,4vw,48px)" class="reveal">' +
          '<div><p class="eyebrow">Where we go</p><h2 class="h-xl mt-s">Routes across India.<br>And a few beyond it.</h2></div>' +
          '<a href="journeys.html" class="btn">See every journey <span class="arw">\u2192</span></a></div>' +
        '<div class="grid-dest reveal">' + feat.map(function (p, n) { return K.card(p, shapes[n]); }).join('') + '</div></div>';

      /* founders strip */
      var open = trips.filter(function (t) { return t.status !== 'Closed'; }).slice(0, 3);
      document.getElementById('foundstrip').innerHTML =
        '<div class="wrap"><div class="founders reveal">' +
          '<div class="slot"><img loading="lazy" src="' + K.esc(site.founder.photo) + '" alt="Founders on the road"></div>' +
          '<div><p class="eyebrow">Travel with the founders</p>' +
          '<h2 class="h-lg mt-s">Twice a year, we go too.</h2>' +
          '<p class="lede mt-m">A handful of departures where the founders travel with the group \u2014 same table, same jeep, same long evenings. Twelve seats, never more.</p>' +
          '<div class="mt-l">' + open.map(function (t) {
            return '<div class="trip"><div><p class="w">' + K.esc(t.title) + '</p><p class="s">' + K.esc(t.dates) + ' \u00b7 ' + t.days + ' days</p></div>' +
              '<span class="seats">' + K.esc(t.status === 'Waitlist' ? 'Waitlist' : (t.seats - t.booked) + ' seats left') + '</span></div>';
          }).join('') + '</div>' +
          '<a href="founders.html" class="btn mt-l">Join a departure <span class="arw">\u2192</span></a>' +
        '</div></div></div>';

      /* reviews */
      document.getElementById('voices').innerHTML =
        '<div class="wrap"><div class="caravan" style="margin-bottom:clamp(48px,7vw,86px)"><b></b><i></i><b></b><i></i><b class="on"></b><i></i><b></b></div>' +
        '<p class="eyebrow reveal">Travellers</p><h2 class="h-lg reveal" style="margin:14px 0 clamp(30px,4vw,48px)">What they said after.</h2>' +
        '<div class="voices reveal">' + site.reviews.map(function (r) {
          return '<div class="voice"><p>\u201C' + K.esc(r.text) + '\u201D</p><p class="who">' + K.esc(r.who) + '</p></div>';
        }).join('') + '</div></div>';
    },

    /* ---------------- JOURNEYS ---------------- */
    journeys: function (site, packages) {
      var live = packages.filter(function (p) { return p.published; });
      var cats = ['All'].concat(live.map(function (p) { return p.category; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      var active = K.qs('category') || (K.qs('region') ? null : 'All');
      var region = K.qs('region');

      var bar = document.getElementById('filters');
      bar.innerHTML = cats.map(function (c) {
        return '<button class="chipf" data-c="' + K.esc(c) + '" aria-pressed="' + (c === active) + '">' + K.esc(c) + '</button>';
      }).join('');

      function draw() {
        var list = live.filter(function (p) {
          if (region) return p.region === region;
          return active === 'All' || p.category === active;
        });
        document.getElementById('grid').innerHTML = list.length
          ? list.map(function (p) { return K.card(p); }).join('')
          : '<p style="color:var(--grey)">Nothing here yet. Try another collection.</p>';
        document.getElementById('count').textContent =
          list.length + (list.length === 1 ? ' journey' : ' journeys') + (region ? ' in ' + region : '');
      }
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('.chipf');
        if (!b) return;
        active = b.dataset.c; region = '';
        bar.querySelectorAll('.chipf').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        draw();
      });
      draw();
    },

    /* ---------------- PACKAGE ---------------- */
    package: function (site, packages) {
      var slug = K.qs('slug') || (window.KAFILA_SLUG || '');
      var p = packages.filter(function (x) { return x.slug === slug; })[0];
      var mount = document.getElementById('pkg');
      if (!p) {
        mount.innerHTML = '<div class="wrap" style="padding-top:160px"><h1 class="h-lg">That journey is not here.</h1>' +
          '<p class="lede mt-m">It may have been renamed or unpublished.</p>' +
          '<a class="btn mt-l" href="' + K.base + 'journeys.html">See every journey <span class="arw">\u2192</span></a></div>';
        return;
      }
      document.title = p.title + ' \u2014 ' + site.brand.name;
      var md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', p.tagline);

      var cta = p.onRequest
        ? '<a class="btn btn--solid" rel="noopener" href="' + K.wa(site, 'Hello Kafila Stories, I am interested in ' + p.title + ' (available on request).') + '">Available on request <span class="arw">\u2192</span></a>'
        : '<a class="btn btn--solid" href="#reserve">Reserve this journey <span class="arw">\u2192</span></a>';

      mount.innerHTML =
        '<div class="hero short"><div class="frame on"><img src="' + K.esc(p.hero) + '" alt="' + K.esc(p.title) + '"></div>' +
          '<div class="wrap"><p class="eyebrow" style="color:var(--gold-lt)">' + K.esc(p.category) + '</p>' +
          '<h1 style="font-size:clamp(34px,6vw,72px)">' + K.esc(p.title) + '</h1>' +
          '<p class="sub">' + K.esc(p.tagline) + '</p></div></div>' +

        '<section class="sheet"><div class="wrap">' +
          '<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between;align-items:end">' +
            '<p class="lede" style="font-size:18px">' + K.esc(p.overview) + '</p>' +
            '<div style="display:flex;gap:12px;flex-wrap:wrap">' + cta +
            '<a class="btn btn--dark" rel="noopener" href="' + K.wa(site, 'Hello, a question about ' + p.title + ':') + '">Ask on WhatsApp</a></div>' +
          '</div>' +

          '<dl class="facts">' +
            fact('Duration', p.nights + ' nights') +
            fact('Group size', p.groupSize) +
            fact('Best months', p.bestMonths) +
            fact('From', p.onRequest ? 'On request' : K.money(p.priceFrom)) +
            fact('Style', p.style) +
          '</dl>' +

          '<div class="tabs" role="tablist">' +
            tab('itin', 'Day by day', true) + tab('stay', 'Stays & meals') +
            tab('incl', 'What is included') + tab('gal', 'Gallery') + tab('faq', 'Questions') +
          '</div>' +

          '<div class="panel on" id="p-itin"><div class="days">' +
            p.itinerary.map(function (d) {
              return '<div class="day"><p class="d">' + K.esc(d.label) + '</p><h4>' + K.esc(d.title) + '</h4><p>' + K.esc(d.text) + '</p></div>';
            }).join('') + '</div></div>' +

          '<div class="panel" id="p-stay"><div class="twocol">' +
            col('Where you sleep', p.stays) + col('What you eat', p.meals) + '</div></div>' +

          '<div class="panel" id="p-incl"><div class="twocol">' +
            col('Included', p.inclusions) + col('Not included', p.exclusions, true) + '</div></div>' +

          '<div class="panel" id="p-gal"><div class="gal">' +
            p.gallery.map(function (g) {
              return '<div class="slot"><img loading="lazy" src="' + K.esc(g) + '" alt="' + K.esc(p.title) + '"></div>';
            }).join('') + '</div></div>' +

          '<div class="panel" id="p-faq"><div class="faq">' +
            p.faqs.map(function (f, i) {
              return '<details' + (i ? '' : ' open') + '><summary>' + K.esc(f.q) + '</summary><p>' + K.esc(f.a) + '</p></details>';
            }).join('') + '</div></div>' +
        '</div></section>' +

        (p.onRequest ? '' : '<section class="reserve" id="reserve"><div id="bkmount"></div></section>');

      function fact(t, v) { return '<div class="fact"><dt>' + t + '</dt><dd>' + K.esc(v) + '</dd></div>'; }
      function tab(id, label, on) {
        return '<button class="tab" role="tab" data-p="' + id + '" aria-selected="' + (on ? 'true' : 'false') + '">' + label + '</button>';
      }
      function col(title, items, no) {
        return '<div><p class="eyebrow" style="margin-bottom:16px">' + title + '</p><ul class="tick' + (no ? ' no' : '') + '">' +
          items.map(function (x) { return '<li>' + K.esc(x) + '</li>'; }).join('') + '</ul></div>';
      }

      mount.querySelectorAll('.tab').forEach(function (t) {
        t.addEventListener('click', function () {
          mount.querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
          t.setAttribute('aria-selected', 'true');
          mount.querySelectorAll('.panel').forEach(function (x) { x.classList.remove('on'); });
          document.getElementById('p-' + t.dataset.p).classList.add('on');
        });
      });

      var bk = document.getElementById('bkmount');
      if (bk) window.KBooking(bk, site, packages, p.slug);
    },

    /* ---------------- FOUNDERS ---------------- */
    founders: function (site, packages, trips) {
      document.getElementById('trips').innerHTML =
        '<div class="wrap"><div class="grid-plain reveal">' +
          trips.map(function (t) {
            var left = t.status === 'Waitlist' ? 'Waitlist' : (t.seats - t.booked) + ' of ' + t.seats + ' seats left';
            return '<a class="card" rel="noopener" href="' + K.wa(site, 'Hello, I would like to join ' + t.title + ' (' + t.dates + ').') + '">' +
              '<span class="tag">' + K.esc(t.dates) + '</span>' +
              '<span class="slot" style="display:block;height:100%"><img loading="lazy" src="' + K.esc(t.image) + '" alt="' + K.esc(t.title) + '"></span>' +
              '<span class="meta"><span>' + K.esc(left) + '</span><h3>' + K.esc(t.title) + '</h3></span></a>';
          }).join('') + '</div></div>';
    },

    /* ---------------- ABOUT ---------------- */
    about: function (site) {
      document.getElementById('sections').innerHTML =
        '<div class="wrap">' + site.about.sections.map(function (s, i) {
          return '<div class="ledger reveal" style="margin-bottom:clamp(40px,6vw,80px)">' +
            '<div><p class="eyebrow">0' + (i + 1) + '</p><h2 class="h-lg mt-s">' + K.esc(s.title) + '</h2></div>' +
            '<div><p class="lede" style="font-size:18px">' + K.esc(s.text) + '</p></div></div>';
        }).join('') +
        '<div class="founders reveal" style="margin-top:clamp(30px,5vw,60px)">' +
          '<div class="slot"><img loading="lazy" src="' + K.esc(site.founder.photo) + '" alt="' + K.esc(site.founder.name) + '"></div>' +
          '<div><p class="eyebrow">Meet the founder</p><h2 class="h-lg mt-s">' + K.esc(site.founder.name) + '</h2>' +
          '<p class="lede mt-m">' + K.esc(site.founder.note) + '</p>' +
          '<a class="btn mt-l" rel="noopener" href="' + K.esc(site.founder.instagram) + '">Follow on Instagram <span class="arw">\u2192</span></a></div>' +
        '</div></div>';
    },

    /* ---------------- CONTACT ---------------- */
    contact: function (site, packages) {
      var c = site.contact;
      document.getElementById('details').innerHTML =
        '<div class="wrap"><div class="twocol">' +
          '<div><p class="eyebrow">Reach us</p><h2 class="h-lg mt-s">However you prefer.</h2>' +
          '<ul class="tick mt-l">' +
            '<li><a href="' + K.wa(site) + '" rel="noopener">WhatsApp \u2014 ' + K.esc(c.phone) + '</a></li>' +
            '<li><a href="tel:' + K.esc(c.phone) + '">' + K.esc(c.phone) + '</a></li>' +
            '<li><a href="mailto:' + K.esc(c.email) + '">' + K.esc(c.email) + '</a></li>' +
            '<li><a href="' + K.esc(c.instagram) + '" rel="noopener">Instagram</a></li>' +
            '<li>' + K.esc(c.address) + '</li>' +
          '</ul>' +
          '<div id="policy" style="margin-top:clamp(30px,4vw,52px)"><p class="eyebrow">Cancellation</p>' +
          '<p class="lede mt-m">' + K.esc(site.legal.cancellation) + '</p></div></div>' +
          '<div><iframe title="Our location" src="' + K.esc(c.mapsEmbed) + '" width="100%" height="400" style="border:1px solid var(--line);border-radius:3px" loading="lazy"></iframe></div>' +
        '</div></div>';
      window.KBooking(document.getElementById('bkmount'), site, packages, K.qs('slug'));
    }
  };

  /* boot */
  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.dataset.page;
    Promise.all([K.load('site'), K.load('packages'), K.load('trips')])
      .then(function (r) {
        K.chrome(r[0], { solid: document.body.dataset.solid === 'true' });
        PAGES[page](r[0], r[1], r[2]);
        K.reveal();
      })
      .catch(function (e) {
        document.body.insertAdjacentHTML('afterbegin',
          '<div style="padding:120px 24px;text-align:center"><h1 style="font-family:var(--display);font-size:28px">The content did not load.</h1>' +
          '<p style="color:var(--grey);margin-top:12px">' + K.esc(e.message) + '. If you opened this file directly, run a local server instead \u2014 see README.</p></div>');
      });
  });
})();
