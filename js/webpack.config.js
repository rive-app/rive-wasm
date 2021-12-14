const path = require('path');

// This file contains various different webpack configurations for the high
// level api. Each one remaps the location of rive_advanced.mjs to the
// appropriate one built by wasm/build_all_wasm.sh.

// Uses canvas_advanced with an externally loaded wasm file.
const canvas = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_advanced.mjs': path.resolve(__dirname, 'npm/canvas_advanced/canvas_advanced.mjs'),
      'package.json': path.resolve(__dirname, 'npm/canvas/package.json'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'npm/canvas'),
    filename: 'rive.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

// Uses canvas_advanced with a bundled wasm file for simplicity/no external wasm
// loading.
const canvasSingle = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_advanced.mjs': path.resolve(__dirname, 'npm/canvas_advanced_single/canvas_advanced_single.mjs'),
      'package.json': path.resolve(__dirname, 'npm/canvas_single/package.json'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'npm/canvas_single'),
    filename: 'rive.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};



// Uses webgl_advanced with an externally loaded wasm file.
const webgl = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_advanced.mjs': path.resolve(__dirname, 'npm/webgl_advanced/webgl_advanced.mjs'),
      'package.json': path.resolve(__dirname, 'npm/webgl/package.json'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'npm/webgl'),
    filename: 'rive.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

// Uses webgl_advanced with a bundled wasm file for simplicity/no external wasm
// loading.
const webglSingle = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_advanced.mjs': path.resolve(__dirname, 'npm/webgl_advanced_single/webgl_advanced_single.mjs'),
      'package.json': path.resolve(__dirname, 'npm/webgl_single/package.json'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'npm/webgl_single'),
    filename: 'rive.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

module.exports = [canvasSingle, canvas, webglSingle, webgl];