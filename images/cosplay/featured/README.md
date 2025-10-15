# Cosplay Featured Sets

Place each featured cosplay set inside its own folder here.

```
cosplay/featured/
  neon-dreams/
    thumbnails/
      image-01.jpg
    full/
      image-01.jpg
    meta.json
```

- Use matching filenames between `thumbnails` and `full`.
- `meta.json` is optional:
  ```json
  {
    "title": "Neon Dreams Collection",
    "description": "Cyberpunk cosplay series shot with LED lighting.",
    "captions": {
      "image-01": "Akira · Neon District"
    }
  }
  ```
- Run `node scripts/generate-gallery-manifests.js` after adding images to update the featured manifest.
