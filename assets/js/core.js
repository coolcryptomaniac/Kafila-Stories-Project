/* Kafila Stories — shared runtime.
   Renders header/footer, loads JSON content, small helpers. */
(function () {
  'use strict';

  var CFG = window.KAFILA_CONFIG || {};
  var depth = (location.pathname.match(/\/(tours|admin)\//) ? '../' : '');
  if (/\/tours\/[^/]+\//.test(location.pathname)) depth = '../../';
  var BASE = depth;

  var K = window.K = {
    cfg: CFG,
    base: BASE,
    cache: {},

    /* ---- data ---- */
    load: function (name) {
      if (K.cache[name]) return Promise.resolve(K.cache[name]);
      return fetch(BASE + 'data/' + name + '.json', { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('Could not load ' + name);
          return r.json();
        })
        .then(function (j) { K.cache[name] = j; return j; });
    },

    /* ---- helpers ---- */
    money: function (n) {
      if (!n) return 'On request';
      return '\u20B9' + Number(n).toLocaleString('en-IN');
    },
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    wa: function (site, text) {
      var n = (site && site.contact && site.contact.whatsapp) || '';
      return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text || 'Hello Kafila Stories, I would like to plan a journey.');
    },
    qs: function (k) {
      return new URLSearchParams(location.search).get(k) || '';
    },

    /* ---- chrome ---- */
    chrome: function (site, opts) {
      opts = opts || {};
      var c = site.contact, b = site.brand;
      var nav = [
        ['journeys.html', 'Journeys'],
        ['founders.html', 'With the Founders'],
        ['about.html', 'About'],
        ['contact.html', 'Contact']
      ];
      var here = location.pathname.split('/').pop() || 'index.html';

      var head = document.createElement('header');
      head.id = 'hdr';
      if (opts.solid) head.className = 'solid';
      head.innerHTML =
        '<div class="wrap nav">' +
          '<a href="' + BASE + 'index.html" class="logo">' + K.esc(b.name) +
            '<small>' + K.esc(b.tagline) + '</small></a>' +
          '<ul id="navlist">' + nav.map(function (n) {
            return '<li><a href="' + BASE + n[0] + '"' +
              (n[0] === here ? ' class="here"' : '') + '>' + n[1] + '</a></li>';
          }).join('') + '</ul>' +
          '<a href="' + BASE + 'contact.html" class="btn btn--solid navcta">Reserve your journey <span class="arw">\u2192</span></a>' +
          '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
        '</div>';
      document.body.insertBefore(head, document.body.firstChild);

      var foot = document.createElement('footer');
      foot.innerHTML =
        '<div class="wrap"><div class="fcols">' +
          '<div><p class="fbrand">' + K.esc(b.name) + '</p>' +
          '<p style="font-size:14px;max-width:30ch">A caravan is a group of travellers crossing difficult ground together. That is the whole idea.</p></div>' +
          '<div><h4>Journeys</h4><ul>' +
            '<li><a href="' + BASE + 'journeys.html?region=India">India</a></li>' +
            '<li><a href="' + BASE + 'journeys.html?region=International">International</a></li>' +
            '<li><a href="' + BASE + 'journeys.html?category=Honeymoon">Honeymoon</a></li>' +
            '<li><a href="' + BASE + 'journeys.html?category=Spiritual+Tours">Spiritual</a></li>' +
          '</ul></div>' +
          '<div><h4>Kafila</h4><ul>' +
            '<li><a href="' + BASE + 'about.html">About us</a></li>' +
            '<li><a href="' + BASE + 'founders.html">Travel with the founders</a></li>' +
            '<li><a href="' + BASE + 'contact.html">Customised journeys</a></li>' +
            '<li><a href="' + BASE + 'contact.html#policy">Cancellation policy</a></li>' +
          '</ul></div>' +
          '<div><h4>Reach us</h4><ul>' +
            '<li><a href="tel:' + K.esc(c.phone) + '">' + K.esc(c.phone) + '</a></li>' +
            '<li><a href="mailto:' + K.esc(c.email) + '">' + K.esc(c.email) + '</a></li>' +
            '<li><a href="' + K.esc(c.instagram) + '" rel="noopener">Instagram</a></li>' +
            '<li><a href="' + K.esc(c.youtube) + '" rel="noopener">YouTube</a></li>' +
          '</ul></div>' +
        '</div><div class="fbot"><span>\u00A9 ' + new Date().getFullYear() + ' ' + K.esc(b.legal) + '</span>' +
        '<span>Photography and some copy are placeholders</span></div></div>';
      document.body.appendChild(foot);

      var wa = document.createElement('a');
      wa.className = 'wa';
      wa.href = K.wa(site);
      wa.rel = 'noopener';
      wa.setAttribute('aria-label', 'Message us on WhatsApp');
      wa.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.8c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.6 1.9.5 2.3.5a2.5 2.5 0 0 0 1.6-1.2c.2-.4.2-.8.1-.9z"/></svg>';
      document.body.appendChild(wa);

      var hdr = document.getElementById('hdr');
      if (!opts.solid) {
        addEventListener('scroll', function () {
          hdr.classList.toggle('stuck', scrollY > 60);
        }, { passive: true });
      }
      var bg = document.getElementById('burger'), list = document.getElementById('navlist');
      bg.addEventListener('click', function () {
        var open = list.classList.toggle('open');
        bg.classList.toggle('x', open);
        bg.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
    },

    reveal: function () {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (e) { io.observe(e); });
    },

    card: function (p, cls) {
      var price = p.onRequest ? 'Available on request' : 'From ' + K.money(p.priceFrom) + ' per person';
      var tag = p.onRequest ? 'On request' : p.region + ' \u00b7 ' + p.nights + ' nights';
      return '<a class="card ' + (cls || '') + '" href="' + BASE + 'package.html?slug=' + encodeURIComponent(p.slug) + '">' +
        '<span class="tag">' + K.esc(tag) + '</span>' +
        '<span class="slot" style="display:block;height:100%"><img loading="lazy" src="' + K.esc(p.hero) + '" alt="' + K.esc(p.title) + '"></span>' +
        '<span class="meta"><span>' + K.esc(price) + '</span><h3>' + K.esc(p.title) + '</h3></span></a>';
    },

    fail: function (el, msg) {
      if (el) el.innerHTML = '<p style="color:var(--grey);font-size:15px">' + K.esc(msg) + '</p>';
    }
  };
})();
