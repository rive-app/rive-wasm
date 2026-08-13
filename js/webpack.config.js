const path = require("path");
const webpack = require("webpack");
const FileManagerPlugin = require("filemanager-webpack-plugin");

// This file contains various different webpack configurations for the high
// level api. Each one remaps the location of rive_advanced.mjs to the
// appropriate one built by wasm/build_all_wasm.sh.

// Uses canvas_advanced with an externally loaded wasm file.
const canvas = {
  entry: "./src/rive.ts",
  target: "web",
  module: {
    // RuntimeLoader supplies locateFile, so never asset-resolve the glue's
    // default wasm URL.
    parser: {
      javascript: {
        url: false,
      },
    },
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      fs: false,
      path: false,
    },
    alias: {
      "./rive_advanced.mjs": path.resolve(
        __dirname,
        "npm/canvas_advanced/canvas_advanced.mjs"
      ),
      "package.json": path.resolve(__dirname, "npm/canvas/package.json"),
    },
  },
  output: {
    path: path.resolve(__dirname, "npm/canvas"),
    filename: "rive.js",
    libraryTarget: "umd",
    library: "rive",
    globalObject: "this",
  },
  devtool: "source-map",
  mode: "none",
  plugins: [
    // import.meta is a syntax error under classic <script> which some devs use today.
    new webpack.DefinePlugin({
      "import.meta.url":
        "(typeof self !== 'undefined' && self.location ? self.location.href : '')",
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: "build/src/rive.d.ts",
              destination: path.resolve(__dirname, "npm/canvas/rive.d.ts"),
            },
            {
              source: "src/rive_advanced.mjs.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas/rive_advanced.mjs.d.ts"
              ),
            },
            {
              source: "build/src/runtimeLoader.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas/runtimeLoader.d.ts"
              ),
            },
            {
              source: "build/src/utils",
              destination: path.resolve(__dirname, "npm/canvas/utils"),
            },
            {
              source: "build/src/semantics",
              destination: path.resolve(__dirname, "npm/canvas/semantics"),
            },
          ],
        },
      },
    }),
  ],
  watchOptions: {
    ignored: ["**/node_modules", "**/npm"],
  },
};

// Similar to canvas, but a lite version with a slimmed down featureset due to removing some dependencies
const canvasLite = {
  ...canvas,
  resolve: {
    ...canvas.resolve,
    alias: {
      "./rive_advanced.mjs": path.resolve(
        __dirname,
        "npm/canvas_advanced_lite/canvas_advanced.mjs"
      ),
      "package.json": path.resolve(__dirname, "npm/canvas_lite/package.json"),
    },
  },
  output: {
    ...canvas.output,
    path: path.resolve(__dirname, "npm/canvas_lite"),
  },
  plugins: [
    new webpack.DefinePlugin({
      "import.meta.url":
        "(typeof self !== 'undefined' && self.location ? self.location.href : '')",
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: "build/src/rive.d.ts",
              destination: path.resolve(__dirname, "npm/canvas_lite/rive.d.ts"),
            },
            {
              source: "src/rive_advanced.mjs.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas_lite/rive_advanced.mjs.d.ts"
              ),
            },
            {
              source: "build/src/runtimeLoader.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas_lite/runtimeLoader.d.ts"
              ),
            },
            {
              source: "build/src/utils",
              destination: path.resolve(__dirname, "npm/canvas_lite/utils"),
            },
            {
              source: "build/src/semantics",
              destination: path.resolve(__dirname, "npm/canvas_lite/semantics"),
            },
          ],
        },
      },
    }),
  ],
};

// Uses canvas_advanced with a bundled wasm file for simplicity/no external wasm
// loading.
const canvasSingle = {
  entry: "./src/rive.ts",
  target: "web",
  module: {
    parser: {
      javascript: {
        url: false,
      },
    },
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      "fs": false,
      "path": false,
    },
    alias: {
      "./rive_advanced.mjs": path.resolve(
        __dirname,
        "npm/canvas_advanced_single/canvas_advanced_single.mjs"
      ),
      "package.json": path.resolve(__dirname, "npm/canvas_single/package.json"),
    },
  },
  output: {
    path: path.resolve(__dirname, "npm/canvas_single"),
    filename: "rive.js",
    libraryTarget: "umd",
    library: "rive",
    globalObject: "this",
  },
  devtool: "source-map",
  mode: "none",
  plugins: [
    new webpack.DefinePlugin({
      "import.meta.url":
        "(typeof self !== 'undefined' && self.location ? self.location.href : '')",
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: "build/src/rive.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas_single/rive.d.ts"
              ),
            },
            {
              source: "src/rive_advanced.mjs.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas_single/rive_advanced.mjs.d.ts"
              ),
            },
            {
              source: "build/src/runtimeLoader.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/canvas_single/runtimeLoader.d.ts"
              ),
            },
            {
              source: "build/src/utils",
              destination: path.resolve(__dirname, "npm/canvas_single/utils"),
            },
            {
              source: "build/src/semantics",
              destination: path.resolve(
                __dirname,
                "npm/canvas_single/semantics"
              ),
            },
          ],
        },
      },
    }),
  ],
  watchOptions: {
    ignored: ["**/node_modules", "**/npm"],
  },
};

// Uses webgl2_advanced with an externally loaded wasm file.
const webgl2 = {
  entry: "./src/rive.ts",
  target: "web",
  module: {
    parser: {
      javascript: {
        url: false,
      },
    },
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      "fs": false,
      "path": false,
    },
    alias: {
      "./rive_advanced.mjs": path.resolve(
        __dirname,
        "npm/webgl2_advanced/webgl2_advanced.mjs"
      ),
      "package.json": path.resolve(__dirname, "npm/webgl2/package.json"),
    },
  },
  output: {
    path: path.resolve(__dirname, "npm/webgl2"),
    filename: "rive.js",
    libraryTarget: "umd",
    library: "rive",
    globalObject: "this",
  },
  devtool: "source-map",
  mode: "none",
  plugins: [
    // import.meta is a syntax error under classic <script> which some devs use today.
    new webpack.DefinePlugin({
      "import.meta.url":
        "(typeof self !== 'undefined' && self.location ? self.location.href : '')",
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: "build/src/rive.d.ts",
              destination: path.resolve(__dirname, "npm/webgl2/rive.d.ts"),
            },
            {
              source: "src/rive_advanced.mjs.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/webgl2/rive_advanced.mjs.d.ts"
              ),
            },
            {
              source: "build/src/runtimeLoader.d.ts",
              destination: path.resolve(
                __dirname,
                "npm/webgl2/runtimeLoader.d.ts"
              ),
            },
            {
              source: "build/src/utils",
              destination: path.resolve(__dirname, "npm/webgl2/utils"),
            },
            {
              source: "build/src/semantics",
              destination: path.resolve(__dirname, "npm/webgl2/semantics"),
            },
          ],
        },
      },
    }),
  ],
  watchOptions: {
    ignored: ["**/node_modules", "**/npm"],
  },
};

// Maps target names (passed via --env targets=... or npm run build:targets) to webpack configs.
// Available targets: canvas, canvas-lite, canvas-single, webgl2
const TARGET_CONFIGS = {
  "canvas": canvas,
  "canvas-lite": canvasLite,
  "canvas-single": canvasSingle,
  "webgl2": webgl2,
};

module.exports = (env = {}) => {
  const targetList = env.targets
    ? env.targets.split(",").map((t) => t.trim())
    : null;

  return targetList
    ? targetList.map((t) => TARGET_CONFIGS[t]).filter(Boolean)
    : [
        canvasSingle,
        canvas,
        canvasLite,
        webgl2,
      ];
};
