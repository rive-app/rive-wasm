const path = require('path');

const webConfig = {
  entry: [
    './src/rive.ts',
    // This is here solely to include the wasm file for packing
    './src/pack_wasm.ts'
  ],
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Rule for including Wasm file
      {
        test: /\.wasm/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      'path': false,
      'fs': false
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive.min.js',
    assetModuleFilename: 'rive.wasm',
    publicPath: '/dist',
    libraryTarget: "var",
    library: "rive"
  },
  mode: 'production',
};

const reactConfig = {
  entry: './src/rive.ts',
  target: 'es6',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Rule for including Wasm file
      {
        test: /\.wasm/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      'path': false,
      'fs': false
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive-dev.js',
    assetModuleFilename: 'rive.wasm',
    publicPath: '/dist',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  mode: 'none',
};

module.exports = [reactConfig, webConfig];