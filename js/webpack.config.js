const path = require('path');

module.exports = {
  entry: './src/rive.js',
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
    filename: 'rive.js',
    assetModuleFilename: 'rive.wasm',
    publicPath: '/dist',
  },
  mode: 'development',
  // mode: 'production',
};