/* Booking form -> Google Apps Script -> Google Sheet.
   Falls back to a clear demo message when API_URL is blank. */
(function () {
  'use strict';
  window.KBooking = function (mount, site, packages, preselect) {
    var pay = site.payment;
    var opts = packages.map(function (p) {
      return '<option value="' + K.esc(p.title) + '"' +
        (p.slug === preselect ? ' selected' : '') + '>' + K.esc(p.title) + '</option>';
    }).join('');

    mount.innerHTML =
      '<div class="wrap">' +
      '<div style="max-width:640px"><p class="eyebrow">Reserve your journey</p>' +
      '<h2 class="h-lg mt-s" style="color:#fff">Tell us roughly when,<br>and we will take it from there.</h2>' +
      '<p class="lede mt-m">A planner replies within one working day. Nothing is charged until you have seen a written itinerary you are happy with.</p></div>' +
      '<div class="form">' +
        f('bk-name', 'Full name', '<input id="bk-name" required placeholder="As on your passport">') +
        f('bk-phone', 'Phone / WhatsApp', '<input id="bk-phone" required placeholder="+91">') +
        f('bk-mail', 'Email', '<input id="bk-mail" type="email" required placeholder="you@example.com">') +
        f('bk-dest', 'Where to', '<select id="bk-dest">' + opts + '<option>Somewhere else entirely</option></select>') +
        f('bk-date', 'Travel date', '<input id="bk-date" type="date">') +
        f('bk-pax', 'Travellers', '<input id="bk-pax" type="number" min="1" value="2">') +
        '<div class="field full"><label for="bk-note">Anything we should know</label>' +
        '<textarea id="bk-note" placeholder="Anniversary, dietary needs, walking pace, a hotel you have had your eye on\u2026"></textarea></div>' +
        '<div class="full" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:8px">' +
          '<button class="btn btn--solid" id="bk-send">Send enquiry <span class="arw">\u2192</span></button>' +
          '<a class="btn btn--light" id="bk-wa" rel="noopener">Or message us on WhatsApp</a>' +
        '</div>' +
        '<div class="msg full" id="bk-msg"></div>' +
      '</div>' +

      '<div class="pay" id="bk-pay">' +
        '<p class="eyebrow" style="color:var(--gold-lt)">Hold your dates</p>' +
        '<h3 style="color:#fff;font-size:26px;margin:12px 0 8px">Pay ' + K.money(pay.depositAmount) + ' to confirm</h3>' +
        '<p style="color:rgba(255,255,255,.6);font-size:15px;max-width:56ch;margin-bottom:26px">Deducted from the final invoice. Pay by UPI or transfer, then upload the receipt \u2014 we will match it against the account and confirm.</p>' +
        '<div class="pay-grid">' +
          '<div class="qr"><img alt="UPI QR code" src="' + qr(pay) + '"></div>' +
          '<dl class="paylines">' +
            '<dt>UPI ID</dt><dd>' + K.esc(pay.upiId) + '</dd>' +
            '<dt>Account name</dt><dd>' + K.esc(pay.accountName) + '</dd>' +
            '<dt>Account number</dt><dd>' + K.esc(pay.accountNumber) + '</dd>' +
            '<dt>IFSC</dt><dd>' + K.esc(pay.ifsc) + '</dd>' +
          '</dl>' +
        '</div>' +
        '<input type="file" id="bk-file" accept="image/*,application/pdf" hidden>' +
        '<div class="drop" id="bk-drop">Upload your payment receipt \u2014 PNG, JPG or PDF</div>' +
        '<div class="status"><span class="pip"></span> <span id="bk-stat">Booking held \u00b7 awaiting verification</span></div>' +
      '</div></div>';

    function f(id, label, input) {
      return '<div class="field"><label for="' + id + '">' + label + '</label>' + input + '</div>';
    }
    function qr(p) {
      if (p.qrImage) return K.esc(p.qrImage);
      var upi = 'upi://pay?pa=' + encodeURIComponent(p.upiId) +
                '&pn=' + encodeURIComponent(p.accountName) +
                '&am=' + (p.depositAmount || '') + '&cu=INR';
      return 'https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=0&data=' + encodeURIComponent(upi);
    }

    var msg = document.getElementById('bk-msg');
    var payBox = document.getElementById('bk-pay');
    var bookingId = null;

    document.getElementById('bk-wa').href = K.wa(site, 'Hello Kafila Stories, I would like to plan a journey.');

    function say(text, kind) {
      msg.textContent = text;
      msg.className = 'msg full on ' + (kind || 'ok');
    }

    function post(payload) {
      if (!K.cfg.API_URL) {
        return Promise.resolve({ ok: true, demo: true, id: 'DEMO-' + Date.now().toString(36).toUpperCase() });
      }
      /* text/plain avoids a CORS preflight, which Apps Script cannot answer */
      return fetch(K.cfg.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); });
    }

    document.getElementById('bk-send').addEventListener('click', function () {
      var v = {}, bad = false;
      ['name', 'phone', 'mail', 'dest', 'date', 'pax', 'note'].forEach(function (k) {
        var el = document.getElementById('bk-' + k);
        v[k] = el.value.trim();
        if (el.hasAttribute('required')) {
          var empty = !v[k];
          el.classList.toggle('err', empty);
          if (empty) bad = true;
        }
      });
      if (bad) return say('Name, phone and email are needed before we can reply.', 'bad');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.mail)) {
        document.getElementById('bk-mail').classList.add('err');
        return say('That email address does not look right.', 'bad');
      }

      var btn = this;
      btn.disabled = true;
      say('Sending\u2026');

      post({
        action: 'booking',
        name: v.name, phone: v.phone, email: v.mail,
        destination: v.dest, travelDate: v.date,
        travellers: v.pax, notes: v.note,
        source: location.href
      }).then(function (r) {
        btn.disabled = false;
        if (!r || !r.ok) throw new Error((r && r.error) || 'Server did not accept the enquiry');
        bookingId = r.id;
        payBox.classList.add('on');
        payBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        say(r.demo
          ? 'Demo mode \u2014 enquiry not saved. Add your Apps Script URL to config.js to record enquiries in the Google Sheet. Reference ' + r.id + '.'
          : 'Enquiry received. Reference ' + r.id + '. Hold your dates below.', 'ok');
      }).catch(function (e) {
        btn.disabled = false;
        say('Could not send that \u2014 ' + e.message + '. Please message us on WhatsApp instead.', 'bad');
      });
    });

    var drop = document.getElementById('bk-drop');
    var file = document.getElementById('bk-file');
    drop.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f0 = file.files[0];
      if (!f0) return;
      if (f0.size > 4 * 1024 * 1024) {
        drop.textContent = 'That file is over 4 MB \u2014 please upload a smaller one.';
        return;
      }
      drop.textContent = 'Uploading ' + f0.name + '\u2026';
      var reader = new FileReader();
      reader.onload = function () {
        post({
          action: 'receipt',
          id: bookingId,
          filename: f0.name,
          mimeType: f0.type || 'application/octet-stream',
          data: String(reader.result).split(',')[1]
        }).then(function (r) {
          if (!r || !r.ok) throw new Error('upload rejected');
          drop.textContent = f0.name + ' \u00b7 uploaded';
          drop.style.borderStyle = 'solid';
          drop.style.color = '#fff';
          document.getElementById('bk-stat').textContent = 'Receipt received \u00b7 awaiting verification';
        }).catch(function () {
          drop.textContent = 'Upload failed \u2014 please send the receipt on WhatsApp instead.';
        });
      };
      reader.readAsDataURL(f0);
    });
  };
})();
