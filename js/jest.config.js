module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: [
    './test'
  ],
  setupFiles: [
    'jest-canvas-mock'
  ]
};
