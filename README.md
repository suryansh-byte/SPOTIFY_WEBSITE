# Spotify OAuth + Playback (scaffold)

This project includes a small Node.js OAuth helper and front-end scaffolding to enable Spotify Authorization Code flow and playback via the Web Playback SDK.

Important notes
- Spotify Web Playback SDK requires the user to have Spotify Premium.
- You must register a Spotify app at https://developer.spotify.com/dashboard and set the Redirect URI to the value you put in `.env` (e.g. `http://localhost:8888/callback`).

Quick setup

1. Copy `.env.example` to `.env` and fill `CLIENT_ID` and `CLIENT_SECRET` from your Spotify app, and set `FRONTEND_URI` to where you serve the static site (e.g. `http://localhost:5500`).

2. Install and run the auth server (Node.js):

```bash
cd "SPOTIFY_WEBSITE"
npm install
npm start
```

3. Serve the static site (your front-end). For local testing you can use a simple static server. Example using `http-server`:

```bash
npx http-server -c-1 -p 5500
```

4. Open the front-end (`http://localhost:5500/search.html`) and click `Login with Spotify`. Complete the auth flow. After redirect the front-end will receive an `access_token` and initialize the Web Playback SDK.

How it works
- `/login` on the server redirects to Spotify's authorization page.
- `/callback` exchanges the code for access/refresh tokens and redirects to `FRONTEND_URI` with the tokens in the URL fragment.
- The front-end reads the `access_token`, initializes the Playback SDK, and can call Spotify Web API endpoints (search + play) to play full tracks on the user's active device.

Limitations and next steps
- The server currently sends tokens in the URL fragment — OK for local development but consider a more secure storage and refresh flow for production.
- Mapping iTunes results to Spotify tracks uses a text search; results may vary. You can enhance search by using ISRC, UPC, or a more advanced matching strategy.
