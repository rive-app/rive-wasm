const path = require("path");
const webpack = require("webpack");
const FileManagerPlugin = require("filemanager-webpack-plugin");

// This file contains various different webpack configurations for the high
// level api. Each one remaps the location of rive_advanced.mjs to the
// appropriate one built by wasm/build_all_wasm.sh.

// Every high-level package's plugins: no import.meta, and the type
// declarations copied in beside rive.js.
const highLevelPlugins = (dir) => [
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
            destination: path.resolve(__dirname, `npm/${dir}/rive.d.ts`),
          },
          {
            source: "src/rive_advanced.mjs.d.ts",
            destination: path.resolve(
              __dirname,
              `npm/${dir}/rive_advanced.mjs.d.ts`
            ),
          },
          {
            source: "build/src/runtimeLoader.d.ts",
            destination: path.resolve(
              __dirname,
              `npm/${dir}/runtimeLoader.d.ts`
            ),
          },
          {
            source: "build/src/utils",
            destination: path.resolve(__dirname, `npm/${dir}/utils`),
          },
          {
            source: "build/src/semantics",
            destination: path.resolve(__dirname, `npm/${dir}/semantics`),
          },
        ],
      },
    },
  }),
];

// Only webgl2-threads bundles a threaded build.
const noThreads = { "./rive_threads.mjs": false };

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
      ...noThreads,
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
  plugins: highLevelPlugins("canvas"),
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
      ...noThreads,
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
  plugins: highLevelPlugins("canvas_lite"),
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
      ...noThreads,
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
  plugins: highLevelPlugins("canvas_single"),
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
      ...noThreads,
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
  plugins: highLevelPlugins("webgl2"),
  watchOptions: {
    ignored: ["**/node_modules", "**/npm"],
  },
};

// webgl2 with the threaded build beside it, which a cross origin isolated
// page loads first.
const webgl2Threads = {
  ...webgl2,
  resolve: {
    ...webgl2.resolve,
    alias: {
      "./rive_advanced.mjs": path.resolve(
        __dirname,
        "npm/webgl2_advanced/webgl2_advanced.mjs"
      ),
      "./rive_threads.mjs": path.resolve(
        __dirname,
        "npm/webgl2_threads/webgl2_threads.mjs"
      ),
      "package.json": path.resolve(__dirname, "npm/webgl2_threads/package.json"),
    },
  },
  output: {
    ...webgl2.output,
    path: path.resolve(__dirname, "npm/webgl2_threads"),
  },
  plugins: highLevelPlugins("webgl2_threads"),
};

// Maps target names (passed via --env targets=... or npm run build:targets) to webpack configs.
// Available targets: canvas, canvas-lite, canvas-single, webgl2, webgl2-threads
const TARGET_CONFIGS = {
  "canvas": canvas,
  "canvas-lite": canvasLite,
  "canvas-single": canvasSingle,
  "webgl2": webgl2,
  "webgl2-threads": webgl2Threads,
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
        webgl2Threads,
      ];
};
