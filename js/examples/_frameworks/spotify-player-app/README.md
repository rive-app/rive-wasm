# Spotify Player App

SvelteKit app using a Rive and Spotify APIs to create an interative music player with simple playback controls.

## Goal

With the launch of Rive events, we built this application to showcase the power of how you can design for signaling particular events at design-time in the Rive editor in coordination with the state machine (i.e. pausing and playing a track, "next"/"prev" button clicked, etc.).

Using the Spotify API, you can login with your own Spotify credentials (no data is logged or stored), and control your Spotify client with this interactive music player.

This project was built with Svelte to showcase how you can use the generalized Web (JS) Rive runtime to use Rive in other declarative UI frameworks.

## Rive Asset

Coming soon!

## Local Development

To run this app locally, you'll need to create a Spotify App at [developer.spotify.com](https://developer.spotify.com/) registered with your own Spotify account (you will need a Preium Subscription to do so). When creating the app on their developer platform, make sure to set redirect URL to `http://localhost:3000`.

When you've created your Spotify App, you should be able to find the "Client ID" in the Settings for the App. Next:
1. Create a `.env` file at the root of this project and copy/paste the contents of `.env.example` into `.env`
2. In `.env`, set the `VITE_SPOTIFY_CLIENT_ID` value to your Spotify App's Client ID and save the file

Install dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
