module.exports = {
  // Needed for handling ES6 modules
  "transform": {
    "^.+\\.m?[t|j]sx?$": "babel-jest"
  },
  "transformIgnorePatterns": [
    // Needed to handle ES6 rive-canvas module
    "/node_modules/(?!rive-canvas).+\\.m?js$"
  ],
  setupFiles: ['jest-canvas-mock'],
  // testEnvironment: 'jsdom',
};