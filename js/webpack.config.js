const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin')

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
    fallback: {
      fs: false,
      path: false,
    },
    alias: {
      './rive_advanced.mjs': path.resolve(__dirname, 'npm/canvas_advanced/canvas_advanced.mjs'),
      'package.json': path.resolve(__dirname, 'npm/canvas/package.json'),
    },
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
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
              source: 'build/src/rive.d.ts',
              destination: path.resolve(__dirname, 'npm/canvas/rive.d.ts')
            },
            {
              source: 'src/rive_advanced.mjs.d.ts',
              destination: path.resolve(__dirname, 'npm/canvas/rive_advanced.mjs.d.ts')
            },
          ]
        }
      }
    })
  ],
  watchOptions: {
    ignored: ['**/node_modules', '**/npm'],
  },
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
    fallback: {
      'fs': false,
      'path': false,
    },
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
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
              source: 'build/src/rive.d.ts',
              destination: path.resolve(__dirname, 'npm/canvas_single/rive.d.ts')
            },
            {
              source: 'src/rive_advanced.mjs.d.ts',
              destination: path.resolve(__dirname, 'npm/canvas_single/rive_advanced.mjs.d.ts')
            },
          ]
        }
      }
    })
  ],
  watchOptions: {
    ignored: ['**/node_modules', '**/npm'],
  },
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
    fallback: {
      'fs': false,
      'path': false,
    },
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
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
              source: 'build/src/rive.d.ts',
              destination: path.resolve(__dirname, 'npm/webgl/rive.d.ts')
            },
            {
              source: 'src/rive_advanced.mjs.d.ts',
              destination: path.resolve(__dirname, 'npm/webgl/rive_advanced.mjs.d.ts')
            },
          ]
        }
      }
    })
  ],
  watchOptions: {
    ignored: ['**/node_modules', '**/npm'],
  },
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
    fallback: {
      'fs': false,
      'path': false,
    },
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
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
              source: 'build/src/rive.d.ts',
              destination: path.resolve(__dirname, 'npm/webgl_single/rive.d.ts')
            },
            {
              source: 'src/rive_advanced.mjs.d.ts',
              destination: path.resolve(__dirname, 'npm/webgl_single/rive_advanced.mjs.d.ts')
            },
          ]
        }
      }
    })
  ],
  watchOptions: {
    ignored: ['**/node_modules', '**/npm'],
  },
};

module.exports = [canvasSingle, canvas, webglSingle, webgl];