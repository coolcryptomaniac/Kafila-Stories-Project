# Setup — from zip to live site

Four steps. Budget about forty minutes the first time.
You need a GitHub account and a Google account. Nothing else, and nothing paid.

---

## 1. Put it on GitHub

1. Create a new repository — call it `kafila-stories`. Public is fine;
   GitHub Pages needs a paid plan for private repos.
2. Upload everything in this folder to the repository, or push it:

   ```bash
   git init
   git add .
   git commit -m "Kafila Stories"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/kafila-stories.git
   git push -u origin main
   ```

3. In the repository: **Settings → Pages → Source: GitHub Actions**.
4. Open the **Actions** tab and wait for the green tick. Your site is at
   `https://YOUR-NAME.github.io/kafila-stories/`.

Now open `config.js` and set `REPO` and `SITE_URL` to match. Commit that.

---

## 2. The Google Sheet backend

This is what receives enquiries. It is free and has no expiry.

1. Create a new Google Sheet. Name it *Kafila Stories Bookings*.
2. Copy its ID from the address bar — the long string between
   `/d/` and `/edit`.
3. Go to **script.google.com** → **New project**.
4. Delete whatever is in the editor and paste all of
   `apps-script/Code.gs`.
5. At the top of that file, fill in three values:

   ```js
   SHEET_ID:      'the ID you copied'
   NOTIFY_EMAIL:  'where enquiry alerts should go'
   ADMIN_KEY:     'a long random string you invent — treat it as a password'
   ```

6. Run the `setup` function once from the editor. Google will ask for
   permission to touch your Sheets, Drive and Gmail — that is expected,
   and it is your own script asking.
7. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Copy the `/exec` URL it gives you.

Put that URL into `config.js` as `API_URL`, and commit.

Until you do this, the booking form runs in demo mode: it looks and
behaves correctly but saves nothing, and says so.

---

## 3. The admin token

The admin panel saves content by committing to this repository, so it
needs permission to do that.

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Repository access: **Only select repositories** → your
   `kafila-stories` repo.
3. Permissions: **Contents → Read and write**. Nothing else.
4. Set an expiry you are comfortable with — 90 days is sensible.
5. Copy the token.

Open `/admin/` on your live site, paste the token and your `ADMIN_KEY`,
and you are in.

> **Security, plainly.** That token lives in your browser's local
> storage. Anyone with access to your unlocked computer can read it and
> commit to this repository. Keep the scope to this one repo, keep the
> expiry short, and sign out on shared machines. This is the trade-off
> for having no server; it is acceptable for one or two people running
> a small business, and it is the first thing to change if the team
> grows.

---

## 4. Your content

**Photography.** Every image is currently a placeholder. Replace them by
pasting your own image URLs into the admin panel. Free hosting that
works well: Cloudinary (25 GB/month) or ImageKit. Upload there, copy the
URL, paste it in.

**Video.** Do not put video in this repository. Upload to YouTube as
unlisted, or to Cloudinary, and use a still image for the hero slides.
A large video on the mobile hero costs you more visitors than it wins.

**Words.** The About and Founder pages say PLACEHOLDER on purpose.
Those are your brand's own words and should not be written by anyone
else. Everything else is written to show the voice and can be edited or
replaced.

**UPI QR.** Leave the QR field blank and one is generated automatically
from your UPI ID. If you would rather use your bank's own QR image,
upload it somewhere and paste the URL.

---

## Custom domain

1. In the repository: **Settings → Pages → Custom domain** →
   `kafilastories.com`.
2. At your registrar, add four A records for the apex pointing to
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`, and a CNAME for `www` pointing to
   `YOUR-NAME.github.io`.
3. Tick **Enforce HTTPS** once the certificate is issued.
4. Update `SITE_URL` in `config.js` and re-run the build.

---

## Weekly, take five minutes

- **Back up the sheet.** File → Download → `.xlsx`. The free tier has no
  automatic backups. Bookings are the one thing here you cannot rebuild.
- **Skim the bookings tab.** Confirm nothing is sitting unanswered.

## Before confirming any booking

A payment screenshot is not proof of payment. They are trivial to forge.
Check the amount against your actual bank statement, then mark it
confirmed in the admin panel.

---

## When you outgrow this

Two signs: enquiries arriving faster than a spreadsheet is comfortable
with, or more than one person needing admin access.

At that point the move is a real database and managed hosting. The
design, the pages and the admin layout all carry over — it is roughly a
day of work, not a rebuild. That is deliberate.

---

## If something breaks

**The site shows "The content did not load."**
You opened a file directly instead of through a server. Use
`python3 -m http.server` locally; on GitHub Pages this cannot happen.

**Admin says "Bad credentials" or 404.**
`REPO` in `config.js` does not match your actual `username/repo`, or the
token has expired or lacks Contents: read and write.

**Enquiries are not arriving.**
Re-deploy the Apps Script as a **new version** — editing the code alone
does not update the live URL. Check "Who has access" is still *Anyone*.

**A saved change is not on the live site.**
Wait for the Actions run to finish, then hard-refresh. Pages caches
aggressively.
