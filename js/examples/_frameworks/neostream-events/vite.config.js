export default {
	assetsInclude: ['**/*.riv'],
	// Needed for testing against a local build of the Rive dependency.
	// Can strip this config below out if working with published builds.
	optimizeDeps: {
		include: [
			"@rive-app/canvas",
		],
	},
}