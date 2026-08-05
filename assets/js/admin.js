/* Kafila Stories admin.
   Content lives as JSON in the repo and is saved through the GitHub
   Contents API. Bookings live in a Google Sheet and are read through
   Apps Script. Nothing runs on a server. */
(function () {
  'use strict';
  var CFG = window.KAFILA_CONFIG || {};
  var S = { tok: '', key: '', data: {}, sha: {} };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ---------- gate ---------- */
  try {
    S.tok = localStorage.getItem('ks_tok') || '';
    S.key = localStorage.getItem('ks_key') || '';
  } catch (e) {}

  function open() {
    $('gate').hidden = true;
    $('app').hidden = false;
    boot();
  }
  if (S.tok || S.key) open();

  $('g-in').addEventListener('click', function () {
    S.tok = $('g-tok').value.trim();
    S.key = $('g-key').value.trim();
    if (!S.tok && !S.key) return alert('Enter at least one credential.');
    try {
      localStorage.setItem('ks_tok', S.tok);
      localStorage.setItem('ks_key', S.key);
    } catch (e) {}
    open();
  });
  $('out').addEventListener('click', function () {
    try { localStorage.removeItem('ks_tok'); localStorage.removeItem('ks_key'); } catch (e) {}
    location.reload();
  });

  /* ---------- github ---------- */
  function api(path, opts) {
    return fetch('https://api.github.com/repos/' + CFG.REPO + '/contents/' + path +
      (opts && opts.method === 'PUT' ? '' : '?ref=' + CFG.BRANCH), Object.assign({
        headers: {
          'Authorization': 'Bearer ' + S.tok,
          'Accept': 'application/vnd.github+json'
        }
      }, opts || {})).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || ('GitHub returned ' + r.status));
          return j;
        });
      });
  }

  function pull(name) {
    return fetch('../data/' + name + '.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (j) { S.data[name] = j; return j; });
  }

  function save(name, flash) {
    if (!S.tok) return note(flash, 'Add a GitHub token to save content changes.', 'bad');
    note(flash, 'Saving\u2026');
    var body = JSON.stringify(S.data[name], null, 2);
    var b64 = btoa(unescape(encodeURIComponent(body)));
    api('data/' + name + '.json').then(function (meta) {
      return api('data/' + name + '.json', {
        method: 'PUT',
        body: JSON.stringify({
          message: 'admin: update ' + name + '.json',
          content: b64, sha: meta.sha, branch: CFG.BRANCH
        })
      });
    }).then(function () {
      note(flash, 'Saved. The live site updates in about a minute.', 'ok');
    }).catch(function (e) {
      note(flash, e.message, 'bad');
    });
  }

  function note(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'flash ' + (kind || '');
  }

  /* ---------- tabs ---------- */
  var TABS = {};
  function boot() {
    document.querySelectorAll('.side button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.side button').forEach(function (x) {
          x.setAttribute('aria-selected', String(x === b));
        });
        TABS[b.dataset.t]();
      });
    });
    TABS.pk();
  }

  function shell(html) { $('stage').innerHTML = html; }

  /* ---------- packages ---------- */
  TABS.pk = function () {
    shell('<p style="color:var(--grey)">Loading\u2026</p>');
    pull('packages').then(function (list) {
      shell(
        '<div id="pk-list"></div>' +
        '<div class="bar"><button class="btn btn--sm" id="pk-new">Add a package</button>' +
        '<span class="flash" id="pk-flash"></span></div>' +
        '<div id="pk-edit"></div>');
      draw();

      function draw() {
        $('pk-list').innerHTML = list.map(function (p, i) {
          var chip = !p.published ? '<span class="chip">Draft</span>'
            : p.onRequest ? '<span class="chip hold">On request</span>'
            : '<span class="chip live">Published</span>';
          return '<div class="row"><div><p class="t">' + esc(p.title) + '</p>' +
            '<p class="m">' + esc(p.region) + ' \u00b7 ' + p.nights + ' nights \u00b7 ' +
            (p.onRequest ? 'on request' : '\u20B9' + Number(p.priceFrom).toLocaleString('en-IN')) +
            ' \u00b7 ' + p.itinerary.length + ' stages \u00b7 ' + p.gallery.length + ' photos</p></div>' +
            '<div class="acts">' + chip +
            '<button class="btn btn--sm" data-e="' + i + '">Edit</button>' +
            '<button class="btn btn--sm" data-d="' + i + '">Delete</button></div></div>';
        }).join('');
      }

      $('pk-list').addEventListener('click', function (e) {
        var ed = e.target.closest('[data-e]'), dl = e.target.closest('[data-d]');
        if (ed) edit(+ed.dataset.e);
        if (dl) {
          var i = +dl.dataset.d;
          if (confirm('Delete "' + list[i].title + '"? This cannot be undone.')) {
            list.splice(i, 1); draw(); save('packages', $('pk-flash'));
          }
        }
      });

      $('pk-new').addEventListener('click', function () {
        list.unshift({
          slug: 'new-journey-' + Date.now().toString(36).slice(-4),
          title: 'New journey', region: 'India', category: 'India Tours',
          nights: 5, priceFrom: 50000, currency: 'INR',
          groupSize: '2 \u2013 12', bestMonths: 'Oct \u2013 Mar', style: 'Private',
          onRequest: false, featured: false, published: false,
          tagline: '', overview: '',
          hero: 'https://picsum.photos/seed/new/1920/1100', gallery: [],
          highlights: [], itinerary: [], stays: [], meals: [],
          inclusions: [], exclusions: [], faqs: []
        });
        draw(); edit(0);
      });

      function edit(i) {
        var p = list[i];
        $('pk-edit').innerHTML =
          '<div class="bar"></div><h3 style="font-size:20px;margin-bottom:18px">Editing: ' + esc(p.title) + '</h3>' +
          '<div class="mini">' +
            fi('t', 'Title', p.title) + fi('s', 'URL slug', p.slug) +
            fs('r', 'Region', p.region, ['India', 'International']) +
            fi('c', 'Collection', p.category) +
            fi('n', 'Nights', p.nights, 'number') + fi('pr', 'Price from (\u20B9)', p.priceFrom, 'number') +
            fi('gs', 'Group size', p.groupSize) + fi('bm', 'Best months', p.bestMonths) +
            fi('hi', 'Hero image URL', p.hero) +
            fs('pub', 'Status', p.published ? 'Published' : 'Draft', ['Published', 'Draft']) +
            fs('req', 'Booking', p.onRequest ? 'On request (WhatsApp)' : 'Instant enquiry', ['Instant enquiry', 'On request (WhatsApp)']) +
            fs('fe', 'Featured on homepage', p.featured ? 'Yes' : 'No', ['No', 'Yes']) +
          '</div>' +
          ft('tg', 'Tagline', p.tagline) + ft('ov', 'Overview', p.overview) +
          '<div class="f"><label>Itinerary</label><div id="itin"></div>' +
            '<button class="btn btn--sm" id="add-day">Add a stage</button></div>' +
          fl('st', 'Stays (one per line)', p.stays) +
          fl('me', 'Meals (one per line)', p.meals) +
          fl('in', 'Inclusions (one per line)', p.inclusions) +
          fl('ex', 'Exclusions (one per line)', p.exclusions) +
          fl('ga', 'Gallery image URLs (one per line)', p.gallery) +
          '<div class="f"><label>Questions</label><div id="faqs"></div>' +
            '<button class="btn btn--sm" id="add-faq">Add a question</button></div>' +
          '<div class="bar"><button class="btn btn--solid btn--sm" id="pk-save">Save changes</button>' +
          '<button class="btn btn--sm" id="pk-close">Close</button>' +
          '<span class="flash" id="pk-flash2"></span></div>';

        drawDays(); drawFaqs();
        $('pk-edit').scrollIntoView({ behavior: 'smooth' });

        function drawDays() {
          $('itin').innerHTML = p.itinerary.map(function (d, n) {
            return '<div class="dayrow"><input data-dl="' + n + '" value="' + esc(d.label) + '" placeholder="Day 01">' +
              '<input data-dt="' + n + '" value="' + esc(d.title) + '" placeholder="Title"></div>' +
              '<div class="dayrow" style="grid-template-columns:1fr auto"><textarea data-dx="' + n + '" placeholder="What happens">' + esc(d.text) + '</textarea>' +
              '<button class="btn btn--sm" data-dd="' + n + '">Remove</button></div>';
          }).join('');
        }
        function drawFaqs() {
          $('faqs').innerHTML = p.faqs.map(function (f, n) {
            return '<div class="dayrow" style="grid-template-columns:1fr auto"><input data-fq="' + n + '" value="' + esc(f.q) + '" placeholder="Question">' +
              '<button class="btn btn--sm" data-fd="' + n + '">Remove</button></div>' +
              '<div class="f"><textarea data-fa="' + n + '" placeholder="Answer">' + esc(f.a) + '</textarea></div>';
          }).join('');
        }

        $('add-day').addEventListener('click', function () {
          collect(); p.itinerary.push({ label: 'Day 0' + (p.itinerary.length + 1), title: '', text: '' }); drawDays();
        });
        $('add-faq').addEventListener('click', function () {
          collect(); p.faqs.push({ q: '', a: '' }); drawFaqs();
        });
        $('itin').addEventListener('click', function (e) {
          var b = e.target.closest('[data-dd]');
          if (b) { collect(); p.itinerary.splice(+b.dataset.dd, 1); drawDays(); }
        });
        $('faqs').addEventListener('click', function (e) {
          var b = e.target.closest('[data-fd]');
          if (b) { collect(); p.faqs.splice(+b.dataset.fd, 1); drawFaqs(); }
        });

        function collect() {
          p.title = v('t'); p.slug = v('s').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          p.region = v('r'); p.category = v('c');
          p.nights = +v('n') || 0; p.priceFrom = +v('pr') || 0;
          p.groupSize = v('gs'); p.bestMonths = v('bm'); p.hero = v('hi');
          p.published = v('pub') === 'Published';
          p.onRequest = v('req').indexOf('On request') === 0;
          p.featured = v('fe') === 'Yes';
          p.tagline = v('tg'); p.overview = v('ov');
          p.stays = lines('st'); p.meals = lines('me');
          p.inclusions = lines('in'); p.exclusions = lines('ex'); p.gallery = lines('ga');
          p.itinerary = p.itinerary.map(function (d, n) {
            return {
              label: val('[data-dl="' + n + '"]') || d.label,
              title: val('[data-dt="' + n + '"]'),
              text: val('[data-dx="' + n + '"]')
            };
          });
          p.faqs = p.faqs.map(function (f, n) {
            return { q: val('[data-fq="' + n + '"]'), a: val('[data-fa="' + n + '"]') };
          });
        }

        $('pk-save').addEventListener('click', function () {
          collect(); draw(); save('packages', $('pk-flash2'));
        });
        $('pk-close').addEventListener('click', function () { $('pk-edit').innerHTML = ''; });
      }
    }).catch(function (e) { shell('<p class="flash bad">' + esc(e.message) + '</p>'); });
  };

  /* ---------- bookings ---------- */
  TABS.bk = function () {
    if (!CFG.API_URL) {
      return shell('<div class="warn">No Apps Script URL in config.js yet, so there are no bookings to show. ' +
        'Follow SETUP.md step 3, then reload this page.</div>');
    }
    if (!S.key) return shell('<div class="warn">Enter your admin key to view bookings. Sign out and enter it.</div>');
    shell('<p style="color:var(--grey)">Loading bookings\u2026</p>');
    fetch(CFG.API_URL + '?action=bookings&key=' + encodeURIComponent(S.key))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || 'Could not read bookings');
        if (!j.rows.length) return shell('<p style="color:var(--grey)">No enquiries yet.</p>');
        shell('<div class="warn">A payment screenshot is not proof of payment. Check your bank statement before marking anything confirmed.</div>' +
          j.rows.map(function (b) {
            var cls = b.status === 'Confirmed' ? 'live' : b.status === 'Pending' ? 'hold' : '';
            return '<div class="row"><div><p class="t">' + esc(b.name) + ' \u00b7 ' + esc(b.destination) + '</p>' +
              '<p class="m">' + esc(b.id) + ' \u00b7 ' + esc(b.travellers) + ' travellers \u00b7 ' + esc(b.travelDate) +
              ' \u00b7 ' + esc(b.phone) + ' \u00b7 ' + esc(b.email) +
              (b.receipt ? ' \u00b7 <a href="' + esc(b.receipt) + '" target="_blank" rel="noopener" style="color:var(--gold)">receipt</a>' : '') +
              (b.notes ? '<br>' + esc(b.notes) : '') + '</p></div>' +
              '<div class="acts"><span class="chip ' + cls + '">' + esc(b.status) + '</span>' +
              '<button class="btn btn--sm" data-ok="' + esc(b.id) + '">Confirm</button>' +
              '<button class="btn btn--sm" data-no="' + esc(b.id) + '">Reject</button></div></div>';
          }).join('') + '<div class="bar"><span class="flash" id="bk-flash"></span></div>');

        $('stage').addEventListener('click', function (e) {
          var ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
          var id = ok ? ok.dataset.ok : no ? no.dataset.no : null;
          if (!id) return;
          var status = ok ? 'Confirmed' : 'Rejected';
          var reason = prompt('Internal note for ' + id + ' (optional):') || '';
          fetch(CFG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'setStatus', key: S.key, id: id, status: status, note: reason })
          }).then(function (r) { return r.json(); })
            .then(function (j) {
              note($('bk-flash'), j.ok ? id + ' marked ' + status.toLowerCase() + '.' : j.error, j.ok ? 'ok' : 'bad');
              if (j.ok) setTimeout(TABS.bk, 700);
            });
        });
      })
      .catch(function (e) { shell('<p class="flash bad">' + esc(e.message) + '</p>'); });
  };

  /* ---------- trips ---------- */
  TABS.tr = function () {
    shell('<p style="color:var(--grey)">Loading\u2026</p>');
    pull('trips').then(function (list) {
      function draw() {
        shell(list.map(function (t, i) {
          return '<div class="mini" style="padding:16px 0;border-bottom:1px solid var(--line)">' +
            fi('tt' + i, 'Departure', t.title) + fi('td' + i, 'Dates', t.dates) +
            fi('tn' + i, 'Days', t.days, 'number') + fi('ts' + i, 'Seats', t.seats, 'number') +
            fi('tb' + i, 'Booked', t.booked, 'number') +
            fs('tx' + i, 'Status', t.status, ['Open', 'Waitlist', 'Closed']) +
            fi('ti' + i, 'Image URL', t.image) +
            '</div>';
        }).join('') +
          '<div class="bar"><button class="btn btn--solid btn--sm" id="tr-save">Save changes</button>' +
          '<button class="btn btn--sm" id="tr-new">Add a departure</button>' +
          '<span class="flash" id="tr-flash"></span></div>');

        $('tr-save').addEventListener('click', function () {
          list.forEach(function (t, i) {
            t.title = v('tt' + i); t.dates = v('td' + i);
            t.days = +v('tn' + i); t.seats = +v('ts' + i); t.booked = +v('tb' + i);
            t.status = v('tx' + i); t.image = v('ti' + i);
          });
          save('trips', $('tr-flash'));
        });
        $('tr-new').addEventListener('click', function () {
          list.push({ title: 'New departure', dates: '', days: 7, seats: 12, booked: 0, status: 'Open', image: 'https://picsum.photos/seed/new-trip/900/700', note: '' });
          draw();
        });
      }
      draw();
    });
  };

  /* ---------- settings tabs ---------- */
  function settings(fields, heading, warn) {
    shell('<p style="color:var(--grey)">Loading\u2026</p>');
    pull('site').then(function (s) {
      shell((warn ? '<div class="warn">' + warn + '</div>' : '') +
        '<h3 style="font-size:19px;margin-bottom:18px">' + heading + '</h3><div class="mini">' +
        fields.map(function (f) {
          var val = f.path.split('.').reduce(function (o, k) { return o[k]; }, s);
          return fi(f.id, f.label, val, f.type || 'text');
        }).join('') + '</div>' +
        '<div class="bar"><button class="btn btn--solid btn--sm" id="s-save">Save changes</button>' +
        '<span class="flash" id="s-flash"></span></div>');
      $('s-save').addEventListener('click', function () {
        fields.forEach(function (f) {
          var keys = f.path.split('.'), last = keys.pop();
          var obj = keys.reduce(function (o, k) { return o[k]; }, s);
          obj[last] = f.type === 'number' ? +v(f.id) : v(f.id);
        });
        save('site', $('s-flash'));
      });
    });
  }

  TABS.py = function () {
    settings([
      { id: 'upi', label: 'UPI ID', path: 'payment.upiId' },
      { id: 'an', label: 'Account holder', path: 'payment.accountName' },
      { id: 'ac', label: 'Account number', path: 'payment.accountNumber' },
      { id: 'if', label: 'IFSC', path: 'payment.ifsc' },
      { id: 'bn', label: 'Bank name', path: 'payment.bankName' },
      { id: 'dp', label: 'Deposit amount (\u20B9)', path: 'payment.depositAmount', type: 'number' },
      { id: 'qr', label: 'QR image URL (blank = generated)', path: 'payment.qrImage' }
    ], 'Payment details',
      'These appear on the booking page. Leave the QR blank and one is generated from your UPI ID automatically.');
  };

  TABS.ct = function () {
    settings([
      { id: 'wa', label: 'WhatsApp (country code, no +)', path: 'contact.whatsapp' },
      { id: 'ph', label: 'Phone', path: 'contact.phone' },
      { id: 'em', label: 'Email', path: 'contact.email' },
      { id: 'ig', label: 'Instagram URL', path: 'contact.instagram' },
      { id: 'yt', label: 'YouTube URL', path: 'contact.youtube' },
      { id: 'ad', label: 'Address', path: 'contact.address' },
      { id: 'mp', label: 'Google Maps embed URL', path: 'contact.mapsEmbed' }
    ], 'Contact and socials');
  };

  TABS.hm = function () {
    settings([
      { id: 'h1', label: 'Headline, first part', path: 'hero.headlineTop' },
      { id: 'h2', label: 'Headline, italic word', path: 'hero.headlineEm' },
      { id: 'h3', label: 'Headline, last part', path: 'hero.headlineEnd' },
      { id: 'hs', label: 'Sub-headline', path: 'hero.sub' },
      { id: 'i1', label: 'Slide 1 image', path: 'hero.slides.0.image' },
      { id: 'l1', label: 'Slide 1 label', path: 'hero.slides.0.label' },
      { id: 'i2', label: 'Slide 2 image', path: 'hero.slides.1.image' },
      { id: 'l2', label: 'Slide 2 label', path: 'hero.slides.1.label' },
      { id: 'i3', label: 'Slide 3 image', path: 'hero.slides.2.image' },
      { id: 'l3', label: 'Slide 3 label', path: 'hero.slides.2.label' }
    ], 'Homepage hero',
      'Video is not hosted here. Put a still image in each slide and embed video from YouTube or Cloudinary \u2014 see SETUP.md.');
  };

  /* ---------- field helpers ---------- */
  function fi(id, label, val, type) {
    return '<div class="f"><label for="x' + id + '">' + label + '</label>' +
      '<input id="x' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '"></div>';
  }
  function ft(id, label, val) {
    return '<div class="f"><label for="x' + id + '">' + label + '</label>' +
      '<textarea id="x' + id + '">' + esc(val) + '</textarea></div>';
  }
  function fl(id, label, arr) {
    return '<div class="f"><label for="x' + id + '">' + label + '</label>' +
      '<textarea id="x' + id + '" style="min-height:110px">' + esc((arr || []).join('\n')) + '</textarea></div>';
  }
  function fs(id, label, val, opts) {
    return '<div class="f"><label for="x' + id + '">' + label + '</label><select id="x' + id + '">' +
      opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
      '</select></div>';
  }
  function v(id) { var el = $('x' + id); return el ? el.value.trim() : ''; }
  function val(sel) { var el = document.querySelector(sel); return el ? el.value.trim() : ''; }
  function lines(id) {
    return v(id).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }
})();
