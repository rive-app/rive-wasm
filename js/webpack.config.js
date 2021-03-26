const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
    extensions: ['.ts', '.js'],
    fallback: {
      'path': false,
      'fs': false
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rive.min.js',
    libraryTarget: 'var',
    library: 'rive'
  },
  devtool: 'source-map',
  mode: 'production',
  // Copy the Wasm file to dist
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: '../wasm/publish/rive.wasm', to: 'rive.wasm' },
      ],
    }),
  ],
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
    filename: 'rive.dev.js',
    libraryTarget: 'umd',
    library: 'rive',
    globalObject: 'this',
  },
  devtool: 'source-map',
  mode: 'none',
};

module.exports = [reactConfig, webConfig];