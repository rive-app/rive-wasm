import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		strictPort: false,
	},
	// Needed for testing against a local build of the Rive dependency.
	// Can strip this config below out if working with published builds.
	optimizeDeps: {
		include: [
			"@rive-app/canvas",
		],
	},
});
