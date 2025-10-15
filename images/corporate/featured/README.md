# Corporate Featured Events

Place each featured corporate event inside its own folder here.

```
corporate/featured/
  executive-summit/
    thumbnails/
      image-01.jpg
    full/
      image-01.jpg
    meta.json
```

- Filenames between `thumbnails` and `full` must match.
- Optional `meta.json` can define titles, descriptions, and per-image captions:
  ```json
  {
    "title": "Executive Summit 2024",
    "description": "Leadership portraits, keynote coverage, and networking moments.",
    "captions": {
      "image-01": "Keynote welcome address"
    }
  }
  ```
- After adding images, run `node scripts/generate-gallery-manifests.js` to refresh featured manifests.
