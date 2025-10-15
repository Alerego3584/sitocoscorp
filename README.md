# Alerego.dev – Photography Portfolio

Modern, Tailwind-powered cosplay and corporate photography showcase designed for Cloudflare Pages.

## Highlights

- ✨ Tailwind CSS via CDN – no build tooling required
- 🧭 Multi-page setup (landing + cosplay + corporate)
- �️ Responsive masonry galleries with lightbox + keyboard controls
- ⚡ Lazy thumbnails and full-res swaps for fast loads
- � Auto-generated image manifests driven by folder contents
- 🚀 Drop-in ready for Cloudflare Pages, Netlify, or any static host

## Project Structure

```
sitonuovo/
├── index.html                   # Landing page with hero + mosaic
├── cosplay/index.html           # Cosplay gallery
├── corporate/index.html         # Corporate gallery
├── scripts/
│   ├── gallery.js               # Shared gallery + lightbox logic
│   ├── home-config.js           # Landing page mosaic selections
│   ├── cosplay-config.js        # Cosplay gallery loader
│   ├── corporate-config.js      # Corporate gallery loader
│   └── generate-gallery-manifests.js  # Manifest generator script
├── images/
│   ├── cosplay/
│   │   ├── thumbnails/          # Optimized thumbs (600–800px)
│   │   ├── full/                # Full-res delivery files (~2000px)
│   │   ├── featured/            # Individual featured set folders
│   │   └── manifest.json        # Auto-generated metadata
│   └── corporate/
│       ├── thumbnails/
│       ├── full/
│       ├── featured/
│       └── manifest.json
└── _headers                     # Cloudflare Pages headers config
```

## Workflow: Adding New Images

1. **Prep assets**
   - Thumbnails: 600–800px on the long edge, JPEG/webp around 75% quality.
   - Full images: 1800–2200px on the long edge, JPEG/webp around 85% quality.

2. **Drop files**
   - Cosplay → `images/cosplay/thumbnails/` & `images/cosplay/full/`
   - Corporate → `images/corporate/thumbnails/` & `images/corporate/full/`
   - Use matching filenames between thumbnail + full (e.g., `shoot-01.jpg`).

3. **Normalise featured sets (optional)**
   ```powershell
   npm run process:featured
   ```
   This command tidies each featured set by moving loose images into `full/`,
   regenerating thumbnails, and scaffolding a `meta.json` with sensible defaults.

4. **Regenerate manifests**
   ```powershell
   npm run generate:manifests
   ```
   The script inspects each folder, matches thumbs to fulls, and rewrites
   `manifest.json` with up-to-date metadata. The front-end automatically pulls
   the manifest and renders the masonry grid.

   - To spotlight a **featured set/event**, create a folder inside
     `images/cosplay/featured/` or `images/corporate/featured/` with this shape:
       ```
       images/cosplay/featured/neon-dreams/
         thumbnails/
         full/
         meta.json (optional)
       ```
     Matching filenames between `thumbnails` and `full` are required. An optional
     `meta.json` can define `title`, `description`, `category`, and per-image
     captions under `captions`.

4. **Preview locally**
   ```powershell
   npx serve -p 4173 c:\sitonuovo
   ```
   Open `http://localhost:4173` to confirm the galleries update as expected.

## Customization Cheatsheet

- **Colors & typography** – Edit the inline `tailwind.config` blocks at the top
  of each HTML file.
- **Feature text & CTAs** – Update copy directly inside the relevant section of
  each page (`index.html`, `cosplay/index.html`, `corporate/index.html`).
- **Home page mosaic** – Tweak `scripts/home-config.js` to spotlight your
  favorite sets.
- **Add another gallery** – Duplicate one of the gallery pages, create a new
  manifest + config loader, and hook it up to navigation.

## Tips for Image Prep

- [Squoosh](https://squoosh.app/) or [TinyPNG](https://tinypng.com/) for quick
  compression.
- ImageMagick batch resize:
  ```bash
  magick mogrify -path thumbnails -resize 800x800 *.jpg
  ```
- Keep consistent color grading between thumbs and fulls for seamless transitions.

## Deployment

Upload the entire `sitonuovo` directory to any static host (Cloudflare Pages,
Netlify, Vercel, S3, etc.). The `_headers` file already includes sensible cache
and security headers for Cloudflare Pages.

## Support

Questions or improvements? Feel free to open an issue or adapt the project for
your own workflow. For deployment specifics, consult the
[Cloudflare Pages docs](https://developers.cloudflare.com/pages/).
