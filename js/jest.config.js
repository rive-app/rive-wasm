module.exports = {
  // Needed for handling ES6 modules
  "transform": {
    "^.+\\.m?[t|j]sx?$": "babel-jest"
  },
  setupFiles: ['jest-canvas-mock'],
  // testEnvironment: 'jsdom',
};