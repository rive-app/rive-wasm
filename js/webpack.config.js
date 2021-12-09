const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// This file contains three different webpack configurations. Each one remaps
// the location of rive_canvas.mjs to the appropriate one built by
// wasm/build-all-wasm.sh.

// Simple configuration for browser friendly bundle. Builds a simple rive.min.js
// that can be directly added to any page with a script tag.
const webConfig = {
  entry: './src/rive.ts',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      './rive_canvas.mjs': path.resolve(__dirname, 'dist/rive_canvas_single.mjs'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive.min.js',
    library: {
      type: 'assign-properties',
      name: 'rive'
    },
  },
  devtool: 'source-map',
  mode: 'production',
  // Copy the Wasm file to dist
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'build/src/rive.d.ts', to: 'rive.d.ts' },
      ],
    }),
  ],
};


// Module configuration for bundler friendly build. Uses rive_canvas with a
// bundled wasm file for simplicity/no external wasm loading.
const moduleConfigSingle = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_canvas.mjs': path.resolve(__dirname, 'dist/rive_canvas_single.mjs'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive_single.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};


// Leanest module configuration for bundler friendly build. Uses rive_canvas
// which will attempt to load wasm bytes via the network for rive_canvas.
const moduleConfig = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_canvas.mjs': path.resolve(__dirname, 'dist/rive_canvas.mjs'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

// Module configuration for bundler friendly build. Uses rive_canvas with a
// bundled wasm file for simplicity/no external wasm loading.
const moduleConfigSingleLight = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      './rive_canvas.mjs': path.resolve(__dirname, 'dist/rive_canvas_light.mjs'),
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive_light.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

module.exports = [moduleConfig, moduleConfigSingle, webConfig, moduleConfigSingleLight];