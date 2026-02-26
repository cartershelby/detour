# Adding a New Location

Step-by-step guide to adding a new location to Détour Obscura.

## 1. Find the Location

Choose a historically interesting place in the Marais (or nearby). Good candidates:
- Have multiple historical events/eras
- Have a visible physical presence today
- Have an interesting story or connection

## 2. Get Coordinates

1. Go to Google Maps
2. Right-click the exact spot → "What's here?"
3. Copy the coordinates (latitude, longitude)
4. **Note:** Leaflet uses `[longitude, latitude]` order in the data, but displays as `[lat, lng]`

## 3. Get an Image

1. Find a good photo of the location (your own, Unsplash, or Wikimedia Commons)
2. Save it to `public/images/` with a short descriptive name (e.g., `flamel.jpg`)
3. Keep images around 640px wide, JPG format

## 4. Add the Location Data

Open `src/App.tsx` and find the `LOCATIONS` array. Add a new entry:

```typescript
{
  id: 'unique-slug',           // URL-friendly identifier
  name: 'Full Location Name',
  coordinates: [2.3549, 48.8619],  // [longitude, latitude]
  period: '1407',              // Primary date/era shown on card
  shortDesc: "Brief tagline",  // One line description
  image: './images/your-image.jpg',
  teaser: {
    era: 'Medieval',           // Historical period
    category: 'Architecture',  // Type: Architecture, Religious, Cultural, etc.
    hint: 'A mysterious hint about what awaits...'  // Shown when locked
  },
  timeline: [
    {
      year: '1407',
      title: 'Event Title',
      description: "What happened. Keep it engaging and concise."
    },
    {
      year: '1500s',
      title: 'Another Event',
      description: "More history..."
    },
    // Add 3-5 timeline events
  ],
  funFact: "A surprising detail most people don't know."
}
```

## 5. Build and Test Locally

```bash
npm run dev
```

- Check the pin appears on the map
- Verify the locked card shows your teaser
- Test the unlocked card timeline navigation
- Confirm the image loads

## 6. Deploy

```bash
# Build
npm run build

# Deploy to gh-pages
cp -r dist /tmp/detour-deploy
cp -r public/images /tmp/detour-deploy/
git checkout gh-pages
rm -rf assets *.html images
cp -r /tmp/detour-deploy/* .
git add -A
git commit -m "Add [location name]"
git push origin gh-pages
git checkout main

# Also commit to main
git add -A
git commit -m "Add [location name]"
git push origin main
```

## Tips

### Writing Good Timeline Events
- Start with the founding/construction
- Include major historical turning points
- End with modern day or recent restoration
- 3-5 events is ideal

### Writing Good Teasers
- Be mysterious but accurate
- Reference something recognizable (person, era, style)
- Make people curious to unlock it

### Choosing Coordinates
- Place the pin at the main entrance or most recognizable spot
- For large sites, pick the center

## Example: Full Location Entry

```typescript
{
  id: 'place-des-vosges',
  name: 'Place des Vosges',
  coordinates: [2.3656, 48.8555],
  period: '1612',
  shortDesc: "Paris's oldest planned square",
  image: './images/vosges.jpg',
  teaser: {
    era: 'Renaissance',
    category: 'Architecture',
    hint: 'Kings dueled here, and a famous writer called it home...'
  },
  timeline: [
    {
      year: '1612',
      title: 'Royal Inauguration',
      description: "Henri IV creates Place Royale as a model of urban planning. The symmetrical red-brick facades set a new standard for Parisian architecture."
    },
    {
      year: '1832',
      title: 'Victor Hugo Moves In',
      description: "The author of Les Misérables lives at No. 6 for 16 years. His apartment is now a museum."
    },
    {
      year: 'Today',
      title: 'Hidden Gem',
      description: "Despite being a major landmark, the square remains surprisingly peaceful — locals picnic under the arcades."
    }
  ],
  funFact: "The last fatal duel in Paris was fought here in 1626 — Henri IV had banned dueling, but nobles ignored him."
}
```
