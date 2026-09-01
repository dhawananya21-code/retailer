# 🌾 Farmer Video Finder

A simple, mobile-friendly web app for retailers. Pick a **District** and a
**Product**, and see matching farmer testimonial videos as tap-to-play cards.

No login needed — built to be used quickly at a shop counter.

## Features

- Two big dropdowns to filter by **District** and **Product**
- Video cards with a thumbnail, short title, and farmer/village name
- Tap a card to play the YouTube video in place (with an "Open in YouTube" fallback)
- **Add New Entry** form to add one video at a time
- **CSV Upload** to add many videos at once
- Data saved permanently in a Postgres database
- Comes preloaded with **12 placeholder demo videos** (clearly labelled "DEMO"),
  removable from the Manage page once real videos are added

> ⚠️ The preloaded videos are **placeholders using public YouTube clips**, not
> real farmer testimonials. They exist only so thumbnails and playback work
> during a demo.

## Tech

- [Next.js](https://nextjs.org/) (App Router)
- [Postgres](https://www.postgresql.org/) via the `postgres` client
- Deploys to [Vercel](https://vercel.com/)

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with your database connection string:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

The database table is created automatically on first run, and the demo videos
are loaded automatically the first time the table is empty.

## CSV format

Header row plus one row per video:

```
district,product,farmer,youtube,title
Nashik,Onion,Ramesh Patil,https://www.youtube.com/watch?v=jNQXAC9IVRw,Onion farmer testimonial
Pune,Wheat,,https://youtu.be/hT_nvWreIhg,Wheat harvest story
```

The `farmer` column is optional.
