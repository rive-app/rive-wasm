// babel.config.js
module.exports = {
  // Needed to transpile ts to js
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
     '@babel/preset-typescript',
  ],
  // Needed for jest to handle ES6 modules
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};