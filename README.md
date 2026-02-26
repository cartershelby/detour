# détour obscura

A location-based historical discovery app for exploring hidden stories in Paris's Marais district.

**Live:** https://cartershelby.github.io/detour/

## Features

- 📍 **Proximity-based unlocking** — Discover locations by physically visiting them (150m radius)
- 🗺️ **Interactive map** — Clean CARTO tiles with glowing blue pins for locations
- 📖 **Timeline stories** — Each location has multiple historical events to explore
- 🔒 **Mystery teasers** — Locked locations show hints about what you'll discover
- 💾 **Progress tracking** — Unlocked locations persist in localStorage
- 📷 **Location images** — Each entry has a photo of the actual place

## Tech Stack

- React + TypeScript + Vite
- Leaflet for maps
- CARTO light tiles
- GitHub Pages hosting

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
# Copy dist/* to gh-pages branch
git checkout gh-pages
rm -rf assets *.html images
cp -r dist/* .
cp -r public/images .
git add -A && git commit -m "Deploy" && git push origin gh-pages
git checkout main
```

## Locations

Currently includes 3 Marais locations:
- **Maison de Nicolas Flamel** (1407) — Paris's oldest stone house
- **Synagogue Agudath Hakehilot** (1913) — Art Nouveau masterpiece by Guimard  
- **Swedish Institute & Café** (1580s) — Renaissance mansion turned cultural haven

## Brand

- Name: "détour obscura" (all lowercase)
- Color: #0080FF (electric blue)
- Logo: Location pin as the "o" in détour
