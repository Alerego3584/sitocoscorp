# Alerego.dev

Portfolio fotografico (cosplay + corporate) su **Cloudflare Pages**.
Le foto e i metadati dei set **non** stanno nel repo: arrivano da KV + R2, come nel sito precedente.

## Come funziona (come il vecchio sito)

| Cosa | Binding | Dettaglio |
| --- | --- | --- |
| Metadati set | KV `ALEREGO_META` | Chiave `galleries_metadata` (array di set: `id`, `type`, `slug`, `title`, `description`, `order`, `images[]`, più campi admin) |
| File | R2 `ALEREGO_GALLERY` | Chiavi tipo `cosplay/featured/{slug}/full/{file}` e lo stesso path con `thumbnails/` |
| API pubblica | `GET /api/public/sets` | Legge il KV |
| Media | `GET /media/{chiave-r2}` | Serve l’oggetto R2 |
| Admin | `/admin/` | `POST /api/admin/auth`, `GET\|POST /api/admin/sets`, `POST /api/admin/upload` |

**Non creare** un KV o un bucket nuovi se i dati del vecchio sito devono restare. Riusa gli stessi binding.

Password admin e JWT **non** vanno nel git: solo variabili d’ambiente su Pages.

## Lingua

Switch **EN / IT** in header. La scelta resta in `localStorage` (`alerego-lang`). Al primo visit, se il browser è italiano parte in italiano.

I titoli dei set restano quelli salvati in admin (non tradotti automaticamente).

## Locale

```bash
npm run dev
```

Apre un mock di Pages (`KV` in `local-data/galleries_metadata.json`, `R2` in `local-data/r2/`).
Non usare un server statico (`npx serve`): `/api` e `/media` non funzionerebbero.

Password locale: variabile `ADMIN_PASSWORD` (fallback solo in `scripts/local-server.mjs`). Non committare `.dev.vars`. Vedi [docs/SECURITY.md](docs/SECURITY.md).

## GitHub (progetto Pages già esistente)

Il sito vecchio è già su Cloudflare Pages, collegato a questo repo. **Non ricreare** il progetto Pages, **non creare** KV o R2 nuovi.

1. `git push` su `origin` (branch `master`).
2. Pages rifà il deploy da solo. **Non c’è `wrangler.toml`**: i binding si impostano solo in dashboard (Settings → Bindings / Functions).
   - KV: variable name `ALEREGO_META`
   - R2: variable name `ALEREGO_GALLERY` → bucket `alerego_gallery`
   - Variabili: `ADMIN_PASSWORD`, `JWT_SECRET`
3. Dopo il deploy: rifai login in `/admin/` (token HMAC nuovi).

Se il deploy precedente ha messo il progetto in modalità Wrangler, dopo questo push i binding della dashboard tornano modificabili. Se `ALEREGO_META` non c’è più, riagganciarlo una volta.

Build Pages: nessuna. Output: root. Functions in `functions/`.

Foto About: metti i file veri in `images/about/` (vedi README lì). L’hero in home si riempie da KV/R2. Per l’anteprima social, opzionale: `images/og/og-image.jpg`.

## Repo da non committare

- `.dev.vars` (se lo usi con Wrangler in locale)
- `node_modules/`
- dump R2 enormi in `local-data/r2/` (opzionale; il seed locale si ricrea)
