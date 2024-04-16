module.exports = {
  // Needed for handling ES6 modules
  "transform": {
    "^.+\\.m?[t|j]sx?$": "babel-jest"
  },
  "moduleNameMapper": {
    "rive_advanced.mjs": "<rootDir>/npm/canvas_advanced_single/canvas_advanced_single.mjs",
    "package.json": "<rootDir>/npm/canvas_advanced_single/package.json",
  },
  "transformIgnorePatterns": [
    // Needed to handle ES6 rive-canvas module
    "/node_modules/(?!rive-canvas).+\\.m?js$"
  ],
  setupFiles: ['jest-canvas-mock', './test/setup.ts']
};
