const path = require('path');

module.exports = {
  entry: './src/rive.js',
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
    filename: 'rive.js',
  },
  mode: 'production'
};