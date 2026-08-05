/**
 * KAFILA STORIES — free backend on Google Apps Script.
 * Stores enquiries in a Google Sheet, receipts in a Drive folder,
 * and emails you on every new enquiry. No server, no cost.
 *
 * Setup is in SETUP.md. In short:
 *   1. Create a Google Sheet, note its ID from the URL.
 *   2. script.google.com -> New project -> paste this file.
 *   3. Fill in the three CONFIG values below.
 *   4. Deploy -> New deployment -> Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Copy the /exec URL into config.js as API_URL.
 */

var CONFIG = {
  SHEET_ID: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
  NOTIFY_EMAIL: 'you@example.com',
  ADMIN_KEY: 'change-this-to-a-long-random-string'
};

var HEADERS = ['Reference', 'Received', 'Status', 'Name', 'Phone', 'Email',
               'Destination', 'Travel date', 'Travellers', 'Notes', 'Receipt', 'Internal note'];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'booking')      return json(createBooking(body));
    if (body.action === 'receipt')      return json(attachReceipt(body));
    if (body.action === 'setStatus')    return json(setStatus(body));
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var p = e.parameter || {};
    if (p.action === 'bookings') {
      if (p.key !== CONFIG.ADMIN_KEY) return json({ ok: false, error: 'Bad key' });
      return json({ ok: true, rows: listBookings() });
    }
    return json({ ok: true, message: 'Kafila Stories API is running.' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------------- core ---------------- */

function sheet() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sh = ss.getSheetByName('Bookings');
  if (!sh) {
    sh = ss.insertSheet('Bookings');
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function createBooking(b) {
  var sh = sheet();
  var ref = 'KS-' + new Date().getTime().toString(36).toUpperCase().slice(-6);
  sh.appendRow([
    ref, new Date(), 'Enquiry',
    clean(b.name), clean(b.phone), clean(b.email),
    clean(b.destination), clean(b.travelDate), clean(b.travellers),
    clean(b.notes), '', ''
  ]);
  notify(ref, b);
  return { ok: true, id: ref };
}

function attachReceipt(b) {
  if (!b.id) return { ok: false, error: 'Missing reference' };
  var folder = receiptFolder();
  var blob = Utilities.newBlob(Utilities.base64Decode(b.data), b.mimeType, b.id + '-' + b.filename);
  var file = folder.createFile(blob);
  var sh = sheet(), rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === b.id) {
      sh.getRange(i + 1, 11).setValue(file.getUrl());
      sh.getRange(i + 1, 3).setValue('Pending');
      MailApp.sendEmail(CONFIG.NOTIFY_EMAIL,
        'Receipt uploaded — ' + b.id,
        'A payment receipt was uploaded for ' + b.id + '.\n\n' + file.getUrl() +
        '\n\nVerify it against your bank statement before confirming. A screenshot alone is not proof of payment.');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Reference not found' };
}

function setStatus(b) {
  if (b.key !== CONFIG.ADMIN_KEY) return { ok: false, error: 'Bad key' };
  var sh = sheet(), rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === b.id) {
      sh.getRange(i + 1, 3).setValue(b.status);
      if (b.note) sh.getRange(i + 1, 12).setValue(b.note);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Reference not found' };
}

function listBookings() {
  var rows = sheet().getDataRange().getValues();
  return rows.slice(1).reverse().map(function (r) {
    return {
      id: r[0], received: r[1], status: r[2], name: r[3], phone: r[4],
      email: r[5], destination: r[6], travelDate: r[7], travellers: r[8],
      notes: r[9], receipt: r[10], internal: r[11]
    };
  });
}

function receiptFolder() {
  var name = 'Kafila Stories — Receipts';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function notify(ref, b) {
  var lines = [
    'New enquiry ' + ref,
    '',
    'Name: ' + clean(b.name),
    'Phone: ' + clean(b.phone),
    'Email: ' + clean(b.email),
    'Destination: ' + clean(b.destination),
    'Travel date: ' + clean(b.travelDate),
    'Travellers: ' + clean(b.travellers),
    '',
    'Notes: ' + clean(b.notes)
  ];
  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, 'New enquiry ' + ref + ' — ' + clean(b.destination), lines.join('\n'));
}

function clean(v) {
  return String(v == null ? '' : v).slice(0, 2000);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor to create the sheet and grant permissions. */
function setup() {
  sheet();
  receiptFolder();
  Logger.log('Ready. Now deploy as a Web App.');
}
