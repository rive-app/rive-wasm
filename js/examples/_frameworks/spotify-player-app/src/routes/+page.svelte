<script lang="ts">
	import RivePlayer from './RivePlayer.svelte';
	import { Scopes, SpotifyApi, AuthorizationCodeWithPKCEStrategy } from "@spotify/web-api-ts-sdk";

	export let sdk: SpotifyApi | null = null;
	const scopes = [
    ...Scopes.userDetails,
    ...Scopes.userRecents,
    ...Scopes.userPlaybackRead,
    ...Scopes.userPlayback,
    ...Scopes.userPlaybackModify,
  ];
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUrl = import.meta.env.VITE_REDIRECT_TARGET;

  async function authenticateSpotify() {
    const auth = new AuthorizationCodeWithPKCEStrategy(clientId, redirectUrl, scopes);
    const internalSdk = new SpotifyApi(auth);

    try {
        const { authenticated } = await internalSdk.authenticate();

        if (authenticated) {
            sdk = internalSdk;
            console.log(sdk);
        }
    } catch (e: Error | unknown) {

        const error = e as Error;
        if (error && error.message && error.message.includes("No verifier found in cache")) {
            console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
        } else {
            console.error(e);
        }
    }
  }
  authenticateSpotify();
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<RivePlayer sdk={sdk} />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
